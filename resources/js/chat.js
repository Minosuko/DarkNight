let ws = null;
let messagesDiv, input, sendBtn, authOverlay, loginBtn, pinInput, authMsg;
let myKeyPair = null;
let myUsername = null;
let currentTopOffset = -1;
let isLoadingHistory = false;
let lastHistoryLoadTime = 0;
let publicKeyCache = {}; // username -> CryptoKey (RSA Public)
let pendingKeyRequests = {}; // username -> array of [resolve, reject] callbacks

// --- Crypto Constants ---
const SALT_LEN = 16;
const IV_LEN = 12;
const ITERATIONS = 100000;

// --- Crypto Functions ---
const enc = new TextEncoder();
const dec = new TextDecoder();
function getEnc() { return enc; }
function getDec() { return dec; }

// --- Binary Protocol Helpers ---
function packBinary(data) {
    if (data.type === 'message' || data.type === 'private_message') {
        const payload = getEnc().encode(data.payload);
        const type = data.recipient ? 0x02 : 0x01;
        const recipient = data.recipient || '';
        const rEnc = getEnc().encode(recipient);
        const buf = new Uint8Array(1 + 1 + rEnc.length + payload.length);
        buf[0] = type;
        buf[1] = rEnc.length;
        buf.set(rEnc, 2);
        buf.set(payload, 2 + rEnc.length);
        return buf.buffer;
    }
    if (data.type === 'login') {
        const token = getEnc().encode(data.token);
        const buf = new Uint8Array(1 + token.length);
        buf[0] = 0x03;
        buf.set(token, 1);
        return buf.buffer;
    }
    if (data.type === 'load_history') {
        const target = getEnc().encode(data.target || "global");
        const pointer = getEnc().encode(data.beforeOffset || "");
        const buf = new Uint8Array(1 + 4 + 1 + target.length + pointer.length);
        buf[0] = 0x04;
        const view = new DataView(buf.buffer);
        view.setUint32(1, data.limit || 20);
        buf[5] = target.length;
        buf.set(target, 6);
        buf.set(pointer, 6 + target.length);
        return buf.buffer;
    }
    if (data.type === 'register') {
        const json = getEnc().encode(JSON.stringify({ t: data.token, p: data.payload }));
        const buf = new Uint8Array(1 + json.length);
        buf[0] = 0x05;
        buf.set(json, 1);
        return buf.buffer;
    }
    if (data.type === 'update_vault') {
        const json = getEnc().encode(JSON.stringify(data.payload));
        const buf = new Uint8Array(1 + json.length);
        buf[0] = 0x06;
        buf.set(json, 1);
        return buf.buffer;
    }
    if (data.type === 'get_public_key') {
        const u = getEnc().encode(data.username);
        const buf = new Uint8Array(1 + 1 + u.length);
        buf[0] = 0x0B;
        buf[1] = u.length;
        buf.set(u, 2);
        return buf.buffer;
    }
    if (data.type === 'encrypted_private_message') {
        const payload = data.payload; // Already a Uint8Array if packed by encryptHybrid
        const recipient = data.recipient || '';
        const rEnc = getEnc().encode(recipient);
        const buf = new Uint8Array(1 + 1 + rEnc.length + payload.length);
        buf[0] = 0x0D;
        buf[1] = rEnc.length;
        buf.set(rEnc, 2);
        buf.set(payload, 2 + rEnc.length);
        return buf.buffer;
    }
    return null;
}

function sendBinary(data) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const bin = packBinary(data);
    if (bin) {
        ws.send(bin);
    } else {
        ws.send(JSON.stringify(data));
    }
}

function unpackBinary(buf) {
    const view = new DataView(buf);
    const type = view.getUint8(0);
    const uint8 = new Uint8Array(buf);

    switch (type) {
        case 0x01: // Global Message
        case 0x02: { // Private Message
            let offset = 1;
            let recipient = "";
            if (type === 0x02) {
                const rLen = uint8[offset++];
                recipient = getDec().decode(uint8.subarray(offset, offset + rLen));
                offset += rLen;
            }
            const sLen = uint8[offset++];
            const sender = getDec().decode(uint8.subarray(offset, offset + sLen));
            offset += sLen;
            const time = view.getUint32(offset);
            offset += 4;
            const payload = getDec().decode(uint8.subarray(offset));
            return { type: 'message', sender, recipient, time, payload };
        }
        case 0x03: { // Login Success (JSON optimized)
            const json = getDec().decode(uint8.subarray(1));
            const data = JSON.parse(json);
            return { type: 'login_success', username: data.u, social_info: data.s, payload: data.v };
        }
        case 0x04: { // History
            let offset = 1;
            const count = view.getUint32(offset);
            offset += 4;
            const messages = [];
            for (let i = 0; i < count; i++) {
                const pLen = view.getUint32(offset);
                offset += 4;
                const payload = buf.slice(offset, offset + pLen);
                offset += pLen;
                const ptrLen = uint8[offset++];
                const pointer = getDec().decode(uint8.subarray(offset, offset + ptrLen));
                offset += ptrLen;

                // Deep unpack the payload
                const msg = unpackBinary(payload);
                if (msg) {
                    msg.pointer = pointer;
                    messages.push(msg);
                }
            }
            const isInitial = uint8[offset++] === 1;
            return { type: 'history', messages, isInitial };
        }
        case 0x05: { // Error
            const message = getDec().decode(uint8.subarray(1));
            return { type: 'error', message };
        }
        case 0x07: { // System Message (Broadcast)
            let offset = 1;
            const time = view.getUint32(offset);
            offset += 4;
            const payload = getDec().decode(uint8.subarray(offset));
            return { type: 'system', sender: 'SYSTEM', time, payload: payload };
        }
        case 0x09: { // Register Success
            const username = getDec().decode(uint8.subarray(1));
            return { type: 'register_success', username };
        }
        case 0x0A: { // Vault Update Success
            return { type: 'update_vault_success' };
        }
        case 0x0C: { // Public Key Response
            let offset = 1;
            const uLen = uint8[offset++];
            const username = getDec().decode(uint8.subarray(offset, offset + uLen));
            offset += uLen;
            const pkLen = view.getUint32(offset);
            offset += 4;
            const publicKeyB64 = getDec().decode(uint8.subarray(offset, offset + pkLen));
            return { type: 'public_key_response', username, publicKey: publicKeyB64 };
        }
        case 0x0D: { // Encrypted Private Message
            let offset = 1;
            const rLen = uint8[offset++];
            const recipient = getDec().decode(uint8.subarray(offset, offset + rLen));
            offset += rLen;
            const sLen = uint8[offset++];
            const sender = getDec().decode(uint8.subarray(offset, offset + sLen));
            offset += sLen;
            const time = view.getUint32(offset);
            offset += 4;
            const payload = uint8.subarray(offset); // Binary payload for hybrid decryption
            return { type: 'encrypted_message', sender, recipient, time, payload };
        }
    }
    return null;
}

async function generateKeyPair() {
    return window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );
}

async function deriveKeyFromPin(pin, salt) {
    const enc = getEnc();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(pin),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: ITERATIONS,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

async function wrapPrivateKey(privateKey, wrappingKey, iv) {
    const keyData = await window.crypto.subtle.exportKey("pkcs8", privateKey);
    return window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        wrappingKey,
        keyData
    );
}

async function unwrapPrivateKey(encryptedData, wrappingKey, iv) {
    const keyData = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        wrappingKey,
        encryptedData
    );
    return window.crypto.subtle.importKey(
        "pkcs8",
        keyData,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        true,
        ["decrypt"]
    );
}

// --- Hybrid Crypto (RSA + AES) ---
async function encryptHybrid(plaintext, recipientPubKey, senderPubKey) {
    // 1. Generate ephemeral AES key
    const aesKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // 2. Encrypt plaintext with AES
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        aesKey,
        getEnc().encode(plaintext)
    );

    const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

    // 3. Wrap AES key for Sender
    const wrappedSenderKey = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        senderPubKey,
        exportedAesKey
    );

    // 4. Wrap AES key for Recipient
    const wrappedRecipientKey = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        recipientPubKey,
        exportedAesKey
    );

    // 5. Pack [SenderKeyLen(4)][SenderKey][RecipientKeyLen(4)][RecipientKey][IV(12)][Ciphertext]
    const buf = new Uint8Array(4 + wrappedSenderKey.byteLength + 4 + wrappedRecipientKey.byteLength + 12 + ciphertext.byteLength);
    const view = new DataView(buf.buffer);

    let offset = 0;
    view.setUint32(offset, wrappedSenderKey.byteLength);
    offset += 4;
    buf.set(new Uint8Array(wrappedSenderKey), offset);
    offset += wrappedSenderKey.byteLength;

    view.setUint32(offset, wrappedRecipientKey.byteLength);
    offset += 4;
    buf.set(new Uint8Array(wrappedRecipientKey), offset);
    offset += wrappedRecipientKey.byteLength;

    buf.set(iv, offset);
    offset += 12;

    buf.set(new Uint8Array(ciphertext), offset);

    return buf;
}

async function decryptHybrid(encData, myPrivKey, isMe = false) {
    if (encData.length < 4) throw new Error("Packet too short");
    const view = new DataView(encData.buffer, encData.byteOffset, encData.byteLength);

    try {
        let offset = 0;
        const firstLen = view.getUint32(offset);
        offset += 4;

        // Diagnostic detection
        const potentialSecondLenPos = 4 + firstLen;
        let keysToTry = [];
        let iv = null;
        let ciphertext = null;
        let isDualWrap = false;

        if (encData.length > potentialSecondLenPos + 4 + 12) {
            const secondLen = view.getUint32(potentialSecondLenPos);
            // Support multiple RSA key sizes (mostly 2048/256 bytes)
            if (secondLen > 100 && secondLen < 600) {
                isDualWrap = true;
                const wrappedSenderKey = encData.subarray(4, 4 + firstLen);
                const wrappedRecipientKey = encData.subarray(potentialSecondLenPos + 4, potentialSecondLenPos + 4 + secondLen);

                iv = encData.subarray(potentialSecondLenPos + 4 + secondLen, potentialSecondLenPos + 4 + secondLen + 12);
                ciphertext = encData.subarray(potentialSecondLenPos + 4 + secondLen + 12);

                // Try BOTH keys. The isMe hint just helps pick the order.
                keysToTry = isMe ? [wrappedSenderKey, wrappedRecipientKey] : [wrappedRecipientKey, wrappedSenderKey];
            }
        }

        if (!isDualWrap) {
            // Legacy Single-Wrap format
            keysToTry = [encData.subarray(4, 4 + firstLen)];
            iv = encData.subarray(4 + firstLen, 4 + firstLen + 12);
            ciphertext = encData.subarray(4 + firstLen + 12);
        }

        let lastErr = null;
        for (let i = 0; i < keysToTry.length; i++) {
            const wrappedKey = keysToTry[i];
            try {
                // 1. Unwrap AES key
                const aesKeyRaw = await window.crypto.subtle.decrypt({ name: "RSA-OAEP" }, myPrivKey, wrappedKey);
                const aesKey = await window.crypto.subtle.importKey("raw", aesKeyRaw, { name: "AES-GCM" }, false, ["decrypt"]);

                // 2. Decrypt with AES
                const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, aesKey, ciphertext);
                return getDec().decode(decrypted);
            } catch (e) {
                lastErr = e;
            }
        }

        // Final failure check: if legacy Single-Wrap from Me, explain why
        if (!isDualWrap && isMe) {
            return "[Secure Message - Encrypted for Recipient (Legacy History)]";
        }

        throw lastErr || new Error("Decryption failed for all keys");

    } catch (err) {
        console.error("Hybrid Decryption Critical Failure:", err);
        throw err;
    }
}

async function fetchPeerPublicKey(username) {
    if (publicKeyCache[username]) return publicKeyCache[username];

    if (pendingKeyRequests[username]) {
        return new Promise((resolve, reject) => {
            pendingKeyRequests[username].push([resolve, reject]);
        });
    }

    pendingKeyRequests[username] = [];
    sendBinary({ type: 'get_public_key', username });

    return new Promise((resolve, reject) => {
        pendingKeyRequests[username].push([resolve, reject]);
        // Timeout after 5s
        setTimeout(() => {
            if (pendingKeyRequests[username]) {
                const reqs = pendingKeyRequests[username];
                delete pendingKeyRequests[username];
                reqs.forEach(([res, rej]) => rej(new Error("Key request timeout")));
            }
        }, 5000);
    });
}

function buffToBase64(buff) { return btoa(String.fromCharCode(...new Uint8Array(buff))); }
function base64ToBuff(b64) {
    const bin = atob(b64);
    const len = bin.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
    return arr.buffer;
}

// --- State ---
let activeConversation = null; // null, 'global' or username
let conversations = {
    'global': {
        name: 'Global Broadcast',
        messages: [],
        topOffset: -1,
        isLoading: false,
        topOffset: -1,
        isLoading: false,
        isInitial: true,
        allLoaded: false
    }
};

// --- Auth flows ---
async function handleLoginSuccess(payload, pin, social_info, username) {
    try {
        myUsername = username;
        mySocialInfo = social_info;
        authMsg.textContent = "";

        if (pin && payload && payload.encryptedPrivateKey) {
            // User has a vault, decrypt it
            const salt = base64ToBuff(payload.salt);
            const iv = base64ToBuff(payload.iv);
            const encryptedPrivKey = base64ToBuff(payload.encryptedPrivateKey);
            const wrappingKey = await deriveKeyFromPin(pin, salt);
            const privateKey = await unwrapPrivateKey(encryptedPrivKey, wrappingKey, iv);

            myKeyPair = {
                publicKey: await window.crypto.subtle.importKey("spki", base64ToBuff(payload.publicKey), { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]),
                privateKey
            };

            // E2E Self-Test
            try {
                const testMsg = "E2E-OK-" + Date.now();
                const enc = await encryptHybrid(testMsg, myKeyPair.publicKey, myKeyPair.publicKey);
                const dec = await decryptHybrid(enc, myKeyPair.privateKey, true);
                if (dec === testMsg) {
                    console.log("[E2E] Self-Test Passed.");
                } else {
                    throw new Error("Self-test payload mismatch");
                }
            } catch (err) {
                console.error("[E2E] Self-Test Failed!", err);
                addSystemMessage("CRITICAL: E2E Self-Test Failed. Your identity may be corrupted.");
            }

            // Save for Persistence if PIN was provided manually
            await saveIdentityToLocal(myUsername, pin);

            authOverlay.classList.add('hidden');
            input.disabled = false;
            sendBtn.disabled = false;
            renderAllMessages();
        } else if (pin && !payload) {
            // User has no vault yet, create one
            await handleRegister(pin);
            return;
        } else {
            // No vault required or login successful without E2E
            authOverlay.classList.add('hidden');
            input.disabled = false;
            sendBtn.disabled = false;
        }

        // Fetch friend list for sidebar and picker
        fetchFriends();
    } catch (e) {
        console.error(e);
        authMsg.textContent = "Decryption Failed! Wrong PIN?";
        clearSavedIdentity();
    }
}

let mySocialInfo = null;

function selectConversation(id, name, pfpId = 0, pfpHash = '') {
    id = id.toLowerCase();
    activeConversation = id;

    // Update Header
    document.getElementById('active-chat-name').textContent = name;

    const pfpImg = document.querySelector('.active-pfp');
    const pfpIcon = document.querySelector('.active-icon'); // The new icon element
    const statusText = document.querySelector('.active-status');

    if (id === 'global') {
        if (pfpImg) pfpImg.style.display = 'none';
        if (pfpIcon) pfpIcon.style.display = 'block';
        statusText.textContent = "● Public Broadcast";
    } else {
        if (pfpImg) {
            pfpImg.style.display = 'block';
            if (pfpId > 0) {
                pfpImg.src = `data/images.php?t=profile&id=${pfpId}&h=${pfpHash}`;
            } else {
                pfpImg.src = 'data/blank.jpg';
            }
        }
        if (pfpIcon) pfpIcon.style.display = 'none';

        statusText.textContent = "● Encrypted Session";
    }

    // Support for Widget Mode
    if (typeof toggleWidgetView === 'function' && document.getElementById('messenger-container').classList.contains('widget-mode')) {
        toggleWidgetView(true);
    }

    // Toggle Active Class in Sidebar
    document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
    if (id === 'global') {
        document.getElementById('conv-global').classList.add('active');
        authOverlay.classList.add('hidden');
    } else {
        // Show Auth Overlay if no identity
        if (!myKeyPair) {
            authOverlay.classList.remove('hidden');
        } else {
            authOverlay.classList.add('hidden');
        }
    }

    // Restriction Check
    if (id === 'global') {
        input.disabled = true;
        sendBtn.disabled = true;
        input.placeholder = "Global Broadcast (Read-Only)";
    } else {
        // For user conversations, enable input (E2E is optional for now)
        input.disabled = false;
        sendBtn.disabled = false;
        input.placeholder = "Aa";
    }

    // Initialize conversation state if new
    if (!conversations[id]) {
        conversations[id] = {
            name: name,
            messages: [],
            topOffset: -1,
            isLoading: false,
            isInitial: true,
            allLoaded: false
        };
    }

    const conv = conversations[id];

    // Clear and Render Messages
    renderAllMessages();

    // Trigger initial history load if empty
    if (conv.messages.length === 0 && !conv.isLoading) {
        sendBinary({ type: 'load_history', limit: 30, target: id });
    }
}

function renderAllMessages() {
    if (!messagesDiv) return;
    messagesDiv.innerHTML = '';
    const conv = conversations[activeConversation] || { messages: [] };
    conv.messages.forEach(m => {
        const mSenderLower = (m.sender || "").toLowerCase();
        const myLower = (myUsername || "").toLowerCase();
        const isMe = (mSenderLower === myLower);
        renderMessage(m.payload, isMe ? 'my-message' : 'peer-message', isMe ? 'Me' : m.sender, false, true, m.time);
    });
    // Final scroll to bottom after bulk render
    scrollToBottom(false);
}

async function handleRegister(pin) {
    const token = getCookie('access_token');
    if (!token) {
        authMsg.textContent = "Session expired. Please reload.";
        return;
    }

    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LEN));
    myKeyPair = await generateKeyPair();
    const wrappingKey = await deriveKeyFromPin(pin, salt);
    const encryptedPrivKey = await wrapPrivateKey(myKeyPair.privateKey, wrappingKey, iv);
    const pubKeyData = await window.crypto.subtle.exportKey("spki", myKeyPair.publicKey);
    const payload = {
        publicKey: buffToBase64(pubKeyData),
        encryptedPrivateKey: buffToBase64(encryptedPrivKey),
        salt: buffToBase64(salt),
        iv: buffToBase64(iv)
    };
    sendBinary({ type: 'register', token: token, payload: payload });
}

// --- DarkMessage Core ---
function setupWsHandlers() {
    ws.binaryType = "arraybuffer";

    ws.onmessage = async (e) => {
        let data = null;
        if (typeof e.data === "string") {
            // Binary-in-text fallback
            if (e.data.length > 0 && e.data.charCodeAt(0) < 32) {
                try {
                    const buf = new Uint8Array(e.data.length);
                    for (let i = 0; i < e.data.length; i++) buf[i] = e.data.charCodeAt(i);
                    data = unpackBinary(buf.buffer);
                } catch (err) {
                    console.error("Binary-in-text unpack failed", err);
                }
            }

            if (!data) {
                try {
                    data = JSON.parse(e.data);
                } catch (err) {
                    console.error("JSON Parse Error", err, e.data);
                }
            }
        } else {
            data = unpackBinary(e.data);
        }
        if (!data) return;
        switch (data.type) {
            case 'error':
                const errMsg = data.message || "";
                if (errMsg === 'User not found') {
                    await handleRegister(pinInput.value);
                } else {
                    // Check if this error belongs to a pending key request
                    if (errMsg.includes("Public key for") && errMsg.includes("not found")) {
                        // Extract username from "Public key for [username] not found."
                        const parts = errMsg.split(" ");
                        const targetUser = parts[3]; // "Public", "key", "for", "[username]", "not", "found."
                        if (targetUser && pendingKeyRequests[targetUser]) {
                            const reqs = pendingKeyRequests[targetUser];
                            delete pendingKeyRequests[targetUser];
                            reqs.forEach(([res, rej]) => rej(new Error(errMsg)));
                        }
                    }
                    authMsg.textContent = "Error: " + errMsg;
                }
                break;
            case 'register_success':
                myUsername = data.username;
                authOverlay.classList.add('hidden');
                input.disabled = false;
                sendBtn.disabled = false;
                addSystemMessage(`Identity Created: [${data.username}]`);
                break;
            case 'login_success':
                await handleLoginSuccess(data.payload, pinInput.value || getSavedPin(), data.social_info, data.username);
                break;
            case 'message':
            case 'encrypted_message':
                const msgRecipient = data.recipient || 'global';
                const isGlobal = (msgRecipient === 'global');
                const myLowerName = (myUsername || "").toLowerCase();
                const senderLower = (data.sender || "").toLowerCase();
                const convId = isGlobal ? 'global' : (senderLower === myLowerName ? (data.recipient || "").toLowerCase() : senderLower);

                if (!conversations[convId]) {
                    conversations[convId] = { messages: [], name: isGlobal ? 'Global Broadcast' : (data.sender === myUsername ? data.recipient : data.sender), topOffset: -1, isLoading: false, allLoaded: false };
                }

                const conv = conversations[convId];

                let payload = data.payload;
                if (data.type === 'encrypted_message' && myKeyPair) {
                    try {
                        const isMe = (senderLower === myLowerName);
                        payload = await decryptHybrid(data.payload, myKeyPair.privateKey, isMe);
                    } catch (err) {
                        console.error("Decryption failed", err);
                        payload = `[Decryption Failed: ${err.message}]`;
                    }
                }

                // Check if this specific message (same time/sender/payload) is already in our state
                if (!conv.messages.some(m => m.time === data.time && m.sender === data.sender && m.payload === payload)) {
                    conv.messages.push({ payload: payload, sender: data.sender, time: data.time });
                }

                if (activeConversation === convId) {
                    const isMe = (senderLower === myLowerName);
                    renderMessage(payload, isMe ? 'my-message' : 'peer-message', isMe ? 'Me' : data.sender);
                }
                break;
            case 'public_key_response':
                try {
                    const key = await window.crypto.subtle.importKey(
                        "spki",
                        base64ToBuff(data.publicKey),
                        { name: "RSA-OAEP", hash: "SHA-256" },
                        true,
                        ["encrypt"]
                    );
                    publicKeyCache[data.username] = key;
                    if (pendingKeyRequests[data.username]) {
                        const reqs = pendingKeyRequests[data.username];
                        delete pendingKeyRequests[data.username];
                        reqs.forEach(([resolve]) => resolve(key));
                    }
                } catch (err) {
                    console.error("Failed to import peer public key", err);
                }
                break;
            case 'history':
                handleHistoryResponse(data);
                break;
            case 'system':
                const sysText = data.payload || data.message;
                // Add to global conversation messages
                if (!conversations['global']) {
                    conversations['global'] = { messages: [], name: 'Global Broadcast', topOffset: -1, isLoading: false, allLoaded: false };
                }
                conversations['global'].messages.push({ payload: sysText, sender: data.sender || 'SYSTEM', time: data.time || Date.now() / 1000 });

                if (activeConversation === 'global') {
                    addMessage(sysText, 'peer-message', data.sender || 'SYSTEM');
                }
                break;
        }
    };
    // ws.onopen = () => addSystemMessage("Connected to server");
    ws.onclose = () => {
        // addSystemMessage("Disconnected from DarkNight");
        ws = null;
    };
}

async function handleHistoryResponse(data) {
    const targetConvId = (activeConversation === 'global' ? 'global' : activeConversation).toLowerCase();
    const conv = conversations[targetConvId];
    if (!conv) {
        isLoadingHistory = false;
        return;
    }

    const msgs = data.messages || [];
    if (msgs.length === 0) {
        conv.allLoaded = true;
        isLoadingHistory = false;
        lastHistoryLoadTime = Date.now();
        // Bounce the scroll slightly to show we reached the top and break the 0-trigger
        if (messagesDiv.scrollTop === 0) messagesDiv.scrollTop = 10;
        return;
    }

    if (msgs.length > 0) {
        conv.topOffset = msgs[0].pointer;
    }

    const oldScrollHeight = messagesDiv.scrollHeight;

    const newMsgs = msgs; // Backend already filtered these for us

    // Decrypt all new messages in batch
    let decryptedNewMsgs = [];
    for (let m of newMsgs) {
        if (m.type === 'encrypted_message' && myKeyPair) {
            try {
                const isHistoryMe = (m.sender.toLowerCase() === (myUsername || "").toLowerCase());
                m.payload = await decryptHybrid(m.payload, myKeyPair.privateKey, isHistoryMe);
            } catch (err) {
                console.error("History decryption failed", err);
                m.payload = `[History Decryption Failed: ${err.message}]`;
            }
        }

        if (!conv.messages.some(existing => existing.time === m.time && existing.sender === m.sender && existing.payload === m.payload)) {
            decryptedNewMsgs.push({ payload: m.payload, sender: m.sender, time: m.time });
        }
    }

    if (decryptedNewMsgs.length > 0) {
        conv.messages = [...decryptedNewMsgs, ...conv.messages];
        conv.messages.sort((a, b) => a.time - b.time);
    }

    if (activeConversation === targetConvId) {
        // Use true to skip auto-scrolling inside renderMessage during bulk render
        renderAllMessages();
        if (data.isInitial) {
            scrollToBottom(false);
        } else {
            // Restore scroll position with Chrome-friendly animation frame
            requestAnimationFrame(() => {
                messagesDiv.scrollTop = messagesDiv.scrollHeight - oldScrollHeight;

                // Safety Buffer: If we are still at 0 (top) after restoration, force a small scroll
                if (messagesDiv.scrollTop <= 10) {
                    messagesDiv.scrollTop = 10;
                }
            });
        }
    }

    // Reset flag AFTER scroll adjustment
    setTimeout(() => {
        isLoadingHistory = false;
        lastHistoryLoadTime = Date.now();
    }, 50);
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function setupUiHandlers() {
    loginBtn.onclick = async () => {
        const pin = pinInput.value.trim();
        if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            authMsg.textContent = "PIN must be exactly 6 digits";
            return;
        }
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            authMsg.textContent = "Connecting to server... Please wait.";
            // Try to reconnect
            initDarkChat();
            setTimeout(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    const token = getCookie('access_token');
                    if (token) {
                        sendBinary({ type: 'login', token: token });
                    }
                } else {
                    authMsg.textContent = "Connection failed. Please reload the page.";
                }
            }, 2000);
            return;
        }
        const token = getCookie('access_token');
        if (!token) {
            authMsg.textContent = "Session expired. Please reload.";
            return;
        }
        authMsg.textContent = "Connecting...";
        sendBinary({ type: 'login', token: token });
    };

    sendBtn.onclick = async () => {
        const text = input.value;
        if (!text) return;

        const isGlobal = (activeConversation === 'global');

        if (isGlobal) {
            sendBinary({ type: 'message', payload: text });
        } else {
            try {
                // E2E Encryption Flow (Dual-Wrap for Sender + Recipient)
                const recipientPubKey = await fetchPeerPublicKey(activeConversation);
                const encryptedPayload = await encryptHybrid(text, recipientPubKey, myKeyPair.publicKey);

                sendBinary({
                    type: 'encrypted_private_message',
                    recipient: activeConversation,
                    payload: encryptedPayload
                });
            } catch (err) {
                console.error("Encryption failed", err);
                addSystemMessage("E2E Error: " + err.message);
                return;
            }
        }

        input.value = '';
        input.style.height = 'auto';
    };

    input.oninput = () => {
        input.style.height = 'auto';
        input.style.height = (input.scrollHeight) + 'px';
    };

    input.onkeydown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendBtn.click();
        }
    };

    messagesDiv.onscroll = () => {
        const conv = conversations[activeConversation];
        if (!conv) return;

        // Trigger history if near top, not loading, cooldown passed, and we have a pointer
        const now = Date.now();
        if (messagesDiv.scrollTop <= 0 && !isLoadingHistory) {
            const conv = conversations[activeConversation];
            if (conv && !conv.allLoaded) {
                const now = Date.now();
                if (now - lastHistoryLoadTime > 1000) {
                    isLoadingHistory = true;
                    const pointer = conv.topOffset || "";
                    sendBinary({ type: 'load_history', limit: 30, beforeOffset: pointer, target: activeConversation });
                }
            }
        }
    };

    // Widget Mode Transition Handler
    const mainView = document.querySelector('.dm-main');
    if (mainView) {
        mainView.addEventListener('transitionend', (e) => {
            if (e.target !== mainView) return; // Ignore bubbling events

            // When the view finishes sliding in, force scroll to bottom
            if (document.getElementById('messenger-container').classList.contains('show-chat')) {
                scrollToBottom(false);
            }
        });
    }
}

// --- Persistence Helpers ---
async function getDeviceKey() {
    let keyHex = localStorage.getItem('dm_device_key');
    if (!keyHex) {
        const key = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
        const exported = await window.crypto.subtle.exportKey("raw", key);
        keyHex = buffToBase64(exported);
        localStorage.setItem('dm_device_key', keyHex);
    }
    return window.crypto.subtle.importKey("raw", base64ToBuff(keyHex), "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function saveIdentityToLocal(username, pin) {
    const deviceKey = await getDeviceKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LEN));
    const encryptedPin = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, deviceKey, getEnc().encode(pin));

    localStorage.setItem('dm_saved_user', username);
    localStorage.setItem('dm_saved_pin_enc', buffToBase64(encryptedPin));
    localStorage.setItem('dm_saved_pin_iv', buffToBase64(iv));
}

let _savedPinCache = null;
async function tryAutoLogin() {
    const savedUser = localStorage.getItem('dm_saved_user');
    const encPin = localStorage.getItem('dm_saved_pin_enc');
    const ivStr = localStorage.getItem('dm_saved_pin_iv');

    if (savedUser && encPin && ivStr) {
        try {
            const deviceKey = await getDeviceKey();
            const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: base64ToBuff(ivStr) },
                deviceKey,
                base64ToBuff(encPin)
            );
            _savedPinCache = getDec().decode(decrypted);
            myUsername = savedUser;
            const token = getCookie('access_token');
            sendBinary({ type: 'login', token: token });
            return true;
        } catch (e) {
            clearSavedIdentity();
        }
    } else {
        const token = getCookie('access_token');
        if (token) {
            sendBinary({ type: 'login', token: token });
            return true;
        }
    }
    return false;
}

function getSavedPin() {
    return _savedPinCache;
}

function initDarkChat() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    messagesDiv = document.getElementById('messages');
    input = document.getElementById('message-input');
    sendBtn = document.getElementById('send-btn');
    authOverlay = document.getElementById('auth-overlay');
    loginBtn = document.getElementById('login-btn');
    pinInput = document.getElementById('pin-input');
    authMsg = document.getElementById('auth-msg');

    if (!messagesDiv) return;

    ws = new WebSocket('ws://' + window.location.hostname + ':8080');
    ws.binaryType = 'arraybuffer';
    setupWsHandlers();
    setupUiHandlers();

    // On WebSocket Open, attempt Auto-Login or Prepare Connection
    ws.onopen = async () => {
        // addSystemMessage("Secure Channel Established.");
        const autoSuccess = await tryAutoLogin();
        if (!autoSuccess) {
            // If no saved PIN, we at least know WHICH user to prepare for
            myUsername = SOCIAL_IDENTITY;
        }
    };
}

// --- Scroll Helper ---
function scrollToBottom(smooth = false) {
    if (!messagesDiv) return;

    // Check for Widget Mode
    const isWidget = document.getElementById('messenger-container').classList.contains('widget-mode');

    const scroll = () => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    };

    if (smooth && !isWidget) {
        // Smooth scroll requested and supported environment
        messagesDiv.scrollTo({ top: messagesDiv.scrollHeight, behavior: 'smooth' });

        // Late safeguard: ensure we are at bottom after transition (500ms safe bet)
        // We do NOT forced instant scroll immediately to avoid cancelling the smooth animation
        setTimeout(scroll, 500);
    } else {
        // Instant scroll explicitly requested or needed (widget)
        scroll();
        // Robustness for layout shifts/images/widget transitions
        requestAnimationFrame(() => {
            scroll();
            setTimeout(scroll, 50);
            setTimeout(scroll, 310);
        });
    }
}

function addMessage(text, className, sender = 'Unknown') {
    renderMessage(text, className, sender, false);
}

function renderMessage(text, className, sender = 'Unknown', prepend = false, skipScroll = false, timestamp = null) {
    if (!messagesDiv) return;

    const isMe = (className === 'my-message');
    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${isMe ? 'me' : 'them'}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    wrapper.appendChild(bubble);

    const meta = document.createElement('div');
    meta.className = `msg-meta ${isMe ? 'me' : 'them'}`;

    const timeToDisplay = timestamp ? new Date(timestamp * 1000) : new Date();
    const timeStr = timeToDisplay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    meta.textContent = `${timeStr}`;

    if (prepend) {
        messagesDiv.insertBefore(meta, messagesDiv.firstChild);
        messagesDiv.insertBefore(wrapper, messagesDiv.firstChild);
    } else {
        // Smart Auto-Scroll Check
        // We check this BEFORE appending the new message
        const threshold = 250; // pixels tolerance
        const isNearBottom = (messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight) <= threshold;

        messagesDiv.appendChild(wrapper);
        messagesDiv.appendChild(meta);

        if (!skipScroll) {
            // Auto-scroll if it's my message OR if the user was already at/near the bottom
            // OR if we are in widget mode (often prefer latest message visibility in small screens)
            const isWidget = document.getElementById('messenger-container').classList.contains('widget-mode');

            if (isMe || isNearBottom || isWidget) {
                scrollToBottom(true);
            }
        }
    }
}

function addSystemMessage(text) {
    if (!messagesDiv) return;
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.textContent = `[IDENTITY] ${text}`;

    // System messages always at bottom or where they happen
    messagesDiv.appendChild(div);
    scrollToBottom(true);
}

// --- PIN Interface ---
async function _changeChatPin(oldPin, newPin) {
    if (!myKeyPair || !myKeyPair.privateKey) {
        throw new Error("Identity not loaded");
    }

    try {
        const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
        const iv = window.crypto.getRandomValues(new Uint8Array(IV_LEN));

        const wrappingKey = await deriveKeyFromPin(newPin, salt);
        const encryptedPrivKey = await wrapPrivateKey(myKeyPair.privateKey, wrappingKey, iv);
        const pubKeyData = await window.crypto.subtle.exportKey("spki", myKeyPair.publicKey);

        const payload = {
            publicKey: buffToBase64(pubKeyData),
            encryptedPrivateKey: buffToBase64(encryptedPrivKey),
            salt: buffToBase64(salt),
            iv: buffToBase64(iv)
        };

        sendBinary({ type: 'update_vault', payload: payload });

        // Update local storage
        await saveIdentityToLocal(myUsername, newPin);
        return true;
    } catch (e) {
        console.error("PIN Change Failed:", e);
        return false;
    }
}

function clearSavedIdentity() {
    localStorage.removeItem('dm_saved_user');
    localStorage.removeItem('dm_saved_pin_enc');
    localStorage.removeItem('dm_saved_pin_iv');
    _savedPinCache = null;
}

// --- User Picker & Search ---
let myFriends = [];

async function fetchFriends() {
    try {
        const response = await fetch('worker/Friend.php?action=get_friends');
        const data = await response.json();
        if (data.success) {
            myFriends = data.friends;
            renderFriends(myFriends);
            // Also populate sidebar
            myFriends.forEach(f => addConversationToSidebar(f));
        }
    } catch (e) {
        console.error("Failed to fetch friends:", e);
    }
}

function renderFriends(list) {
    const container = document.getElementById('picker-list');
    if (!container) return;
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#666; margin-top:20px;">No friends found.</div>';
        return;
    }

    list.forEach(friend => {
        const item = document.createElement('div');
        item.className = 'picker-item';
        item.onclick = () => {
            selectConversation(friend.user_nickname, friend.user_firstname + ' ' + friend.user_lastname, friend.pfp_media_id, friend.pfp_media_hash);
            document.getElementById('modal-user-picker').classList.add('hidden');
            // Ensure sidebar item exists
            if (!document.getElementById(`conv-${friend.user_nickname}`)) {
                // Trigger re-render or manually add (selecting conversation handles logic usually)
                // Actually selectConversation doesn't add to sidebar UI, only state. 
                // We should add it to sidebar UI if not present.
                addConversationToSidebar(friend);
            }
        };

        const img = document.createElement('img');
        img.src = friend.pfp_media_id > 0 ? `data/images.php?t=profile&id=${friend.pfp_media_id}&h=${friend.pfp_media_hash}` : 'data/blank.jpg';

        const name = document.createElement('span');
        name.textContent = `${friend.user_firstname} ${friend.user_lastname} (@${friend.user_nickname})`;
        name.style.color = 'white';

        item.appendChild(img);
        item.appendChild(name);
        container.appendChild(item);
    });
}

function addConversationToSidebar(friend) {
    const list = document.getElementById('conv-list');
    const existing = document.getElementById(`conv-${friend.user_nickname}`);
    if (existing) return;

    const div = document.createElement('div');
    div.className = 'conversation-item';
    div.id = `conv-${friend.user_nickname}`;
    div.onclick = () => selectConversation(friend.user_nickname, friend.user_firstname + ' ' + friend.user_lastname, friend.pfp_media_id, friend.pfp_media_hash);

    const img = document.createElement('img');
    img.className = 'avatar-small';
    img.src = friend.pfp_media_id > 0 ? `data/images.php?t=profile&id=${friend.pfp_media_id}&h=${friend.pfp_media_hash}` : 'data/blank.jpg';

    const info = document.createElement('div');
    info.className = 'conv-info';

    const name = document.createElement('div');
    name.className = 'conv-name';
    name.textContent = friend.user_firstname + ' ' + friend.user_lastname;

    const lastMsg = document.createElement('div');
    lastMsg.className = 'conv-last-msg';
    lastMsg.textContent = 'Start a conversation';

    info.appendChild(name);
    info.appendChild(lastMsg);
    div.appendChild(img);
    div.appendChild(info);

    // Insert after Global
    const globalConv = document.getElementById('conv-global');
    if (globalConv && globalConv.nextSibling) {
        list.insertBefore(div, globalConv.nextSibling);
    } else {
        list.appendChild(div);
    }
}

function setupUserPicker() {
    const btn = document.getElementById('btn-new-chat');
    const picker = document.getElementById('modal-user-picker');
    const search = document.getElementById('picker-search');

    if (btn && picker) {
        btn.onclick = () => {
            picker.classList.remove('hidden');
            fetchFriends(); // Refresh list
        };

        // Search in picker
        if (search) {
            search.oninput = (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = myFriends.filter(f =>
                    f.user_nickname.toLowerCase().includes(term) ||
                    (f.user_firstname + ' ' + f.user_lastname).toLowerCase().includes(term)
                );
                renderFriends(filtered);
            };
        }
    }
}

function setupChatSearch() {
    const search = document.getElementById('chat-search');
    if (!search) return;

    search.oninput = (e) => {
        const term = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.conversation-item');

        items.forEach(item => {
            const name = item.querySelector('.conv-name').textContent.toLowerCase();
            // Also search last message if you want
            const lastMsg = item.querySelector('.conv-last-msg').textContent.toLowerCase();

            if (name.includes(term) || lastMsg.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    };
}

// Call init on load for direct page access or via script injection
// Modified init to call new setups
const originalInit = initDarkChat;
initDarkChat = function () {
    originalInit();
    setupUserPicker();
    setupChatSearch();
};
initDarkChat();
