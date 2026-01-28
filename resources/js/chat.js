let ws = null;
let messagesDiv, input, sendBtn, authOverlay, loginBtn, pinInput, authMsg, inputArea;
let myKeyPair = null;
let myUsername = null;
let currentTopOffset = -1;
let isLoadingHistory = false;
let lastHistoryLoadTime = 0;
let myUserID = 0;
const idToUserMap = {}; // Registry: ID -> { nickname, name, pfpId, pfpHash, verified }
let userAliases = JSON.parse(localStorage.getItem('chat_aliases') || '{}');
let publicKeyCache = {}; // userId -> CryptoKey (RSA Public)
let pendingKeyRequests = {}; // userId -> array of [resolve, reject] callbacks
let lastRenderedSenderID = null;

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
        const type = data.recipientID ? 0x02 : 0x01;
        const buf = new Uint8Array(1 + (type === 0x02 ? 4 : 0) + payload.length);
        buf[0] = type;
        const view = new DataView(buf.buffer);
        let offset = 1;
        if (type === 0x02) {
            view.setUint32(offset, data.recipientID);
            offset += 4;
        }
        buf.set(payload, offset);
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
        const pointer = getEnc().encode(data.beforeOffset || "");
        const buf = new Uint8Array(1 + 4 + 4 + pointer.length);
        buf[0] = 0x04;
        const view = new DataView(buf.buffer);
        view.setUint32(1, data.limit || 20);
        view.setUint32(5, data.targetID || 0); // 0 = global
        buf.set(pointer, 9);
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
        const buf = new Uint8Array(1 + 4);
        buf[0] = 0x0B;
        new DataView(buf.buffer).setUint32(1, data.userId);
        return buf.buffer;
    }
    if (data.type === 'encrypted_private_message') {
        const payload = data.payload;
        const buf = new Uint8Array(1 + 4 + payload.length);
        buf[0] = 0x0D;
        new DataView(buf.buffer).setUint32(1, data.recipientID);
        buf.set(payload, 5);
        return buf.buffer;
    }
    if (data.type === 'get_last_messages') {
        const targets = data.targets || [];
        const buf = new Uint8Array(1 + 4 + (targets.length * 4));
        buf[0] = 0x0E;
        const view = new DataView(buf.buffer);
        view.setUint32(1, targets.length);
        let offset = 5;
        targets.forEach(tid => {
            view.setUint32(offset, tid);
            offset += 4;
        });
        return buf.buffer;
    }
    if (data.type === 'attachment') {
        const hash = getEnc().encode(data.mediaHash);
        const buf = new Uint8Array(1 + 4 + 4 + 1 + hash.length);
        buf[0] = 0x0F;
        const view = new DataView(buf.buffer);
        view.setUint32(1, data.recipientID || 0);
        view.setUint32(5, data.mediaID);
        buf[9] = hash.length;
        buf.set(hash, 10);
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
        case 0x01: // Global Message: opcode (1) + senderID (4) + time (4) + payload (N)
        case 0x02: { // Private Message: opcode (1) + [recipientID (4)] + senderID (4) + time (4) + payload (N)
            let offset = 1;
            let recipientID = 0;
            if (type === 0x02) {
                recipientID = view.getUint32(offset);
                offset += 4;
            }
            const senderID = view.getUint32(offset);
            offset += 4;
            const time = view.getUint32(offset);
            offset += 4;
            const payload = getDec().decode(uint8.subarray(offset));
            return { type: 'message', senderID, recipientID, time, payload };
        }
        case 0x03: { // Login Success (JSON optimized)
            const json = getDec().decode(uint8.subarray(1));
            const data = JSON.parse(json);
            return { type: 'login_success', username: data.u, userID: data.id, social_info: data.s, payload: data.v };
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
            return { type: 'system', senderID: 0, time, payload: payload };
        }
        case 0x09: { // Register Success
            const userID = view.getUint32(1);
            const username = getDec().decode(uint8.subarray(5));
            return { type: 'register_success', username, userID };
        }
        case 0x0A: { // Vault Update Success
            return { type: 'update_vault_success' };
        }
        case 0x0C: { // Public Key Response
            let offset = 1;
            const userId = view.getUint32(offset);
            offset += 4;
            const pkLen = view.getUint32(offset);
            offset += 4;
            const publicKeyB64 = getDec().decode(uint8.subarray(offset, offset + pkLen));
            return { type: 'public_key_response', userId, publicKey: publicKeyB64 };
        }
        case 0x0D: { // Encrypted Private Message
            let offset = 1;
            const recipientID = view.getUint32(offset);
            offset += 4;
            const senderID = view.getUint32(offset);
            offset += 4;
            const time = view.getUint32(offset);
            offset += 4;
            const payload = uint8.subarray(offset); // Binary payload for hybrid decryption
            return { type: 'encrypted_message', senderID, recipientID, time, payload };
        }
        case 0x0E: { // Last Messages Response
            let offset = 1;
            const count = view.getUint32(offset);
            offset += 4;
            const data = {};
            for (let i = 0; i < count; i++) {
                const targetID = view.getUint32(offset);
                offset += 4;
                const mLen = view.getUint32(offset);
                offset += 4;
                const msgBinary = uint8.subarray(offset, offset + mLen);
                offset += mLen;
                const unpacked = unpackBinary(msgBinary.buffer.slice(msgBinary.byteOffset, msgBinary.byteOffset + msgBinary.byteLength));
                if (unpacked) {
                    data[targetID] = unpacked;
                }
            }
            return { type: 'last_messages_response', data };
        }
        case 0x0F: { // Attachment
            let offset = 1;
            const recipientID = view.getUint32(offset);
            offset += 4;
            const senderID = view.getUint32(offset);
            offset += 4;
            const time = view.getUint32(offset);
            offset += 4;
            const mediaID = view.getUint32(offset);
            offset += 4;
            const hashLen = uint8[offset++];
            const mediaHash = getDec().decode(uint8.subarray(offset, offset + hashLen));
            return { type: 'attachment', senderID, recipientID, time, mediaID, mediaHash };
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

async function fetchPeerPublicKey(userId) {
    if (publicKeyCache[userId]) return publicKeyCache[userId];

    if (pendingKeyRequests[userId]) {
        return new Promise((resolve, reject) => {
            pendingKeyRequests[userId].push([resolve, reject]);
        });
    }

    pendingKeyRequests[userId] = [];
    sendBinary({ type: 'get_public_key', userId });

    return new Promise((resolve, reject) => {
        pendingKeyRequests[userId].push([resolve, reject]);
        // Timeout after 5s
        setTimeout(() => {
            if (pendingKeyRequests[userId]) {
                const reqs = pendingKeyRequests[userId];
                delete pendingKeyRequests[userId];
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
let activeConversation = 0; // 0 for global, or userID
let conversations = {
    0: {
        name: 'Global Broadcast',
        messages: [],
        topOffset: -1,
        isLoading: false,
        isInitial: true,
        allLoaded: false
    }
};

// --- Auth flows ---
async function handleLoginSuccess(payload, pin, social_info, username, userID) {
    try {
        myUsername = username;
        myUserID = userID;
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

function selectConversation(id, name, pfpId = 0, pfpHash = '', skipPush = false) {
    if (id === 'global') id = 0;
    activeConversation = id;

    // Resolve current name (check alias first)
    const displayName = userAliases[id] || name;

    // Update Header
    document.getElementById('active-chat-name').textContent = displayName;

    const pfpImg = document.querySelector('.active-pfp');
    const pfpIcon = document.querySelector('.active-icon');
    const statusText = document.querySelector('.active-status');

    if (id === 0) {
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
    const activeEl = document.getElementById(`conv-${id}`);
    if (activeEl) activeEl.classList.add('active');

    if (id === 0) {
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
    const isGlobal = (id === 0);
    const isAdmin = (mySocialInfo && parseInt(mySocialInfo.verified || 0) >= 20);

    if (isGlobal) {
        if (inputArea) inputArea.classList.add('hidden');
        input.disabled = true;
        sendBtn.disabled = true;
        input.placeholder = "Global Broadcast (Read-Only)";
    } else {
        if (inputArea) inputArea.classList.remove('hidden');
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
        sendBinary({ type: 'load_history', limit: 30, targetID: id });
    }

    // Update URL dynamically (SPA support)
    if (!skipPush) {
        if (id !== 0) {
            window.history.pushState({ id: id, name: name }, "", "DarkMessage.php?id=" + id);
        } else {
            window.history.pushState({ id: 0, name: 'Global Broadcast' }, "", "DarkMessage.php");
        }
    }
}

function renderAllMessages() {
    if (!messagesDiv) return;
    messagesDiv.innerHTML = '';
    lastRenderedSenderID = null;
    const conv = conversations[activeConversation] || { messages: [] };
    conv.messages.forEach(m => {
        if (m.type === 'attachment') {
            renderAttachment(m.mediaID, m.mediaHash, m.senderID, false, true, m.time);
        } else {
            renderMessage(m.payload, m.senderID, false, true, m.time);
        }
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
                    // Extract ID from bracketed error if present 
                    // (e.g., "Public key for user #123 not found.")
                    const match = errMsg.match(/#(\d+)/);
                    if (match) {
                        const targetId = parseInt(match[1]);
                        if (pendingKeyRequests[targetId]) {
                            const reqs = pendingKeyRequests[targetId];
                            delete pendingKeyRequests[targetId];
                            reqs.forEach(([res, rej]) => rej(new Error(errMsg)));
                        }
                    }
                    authMsg.textContent = "Error: " + errMsg;
                }
                break;
            case 'register_success':
                myUsername = data.username;
                myUserID = data.userID;
                authOverlay.classList.add('hidden');
                addSystemMessage(`Identity Created: [${data.username}] (#${data.userID})`);
                break;
            case 'login_success':
                await handleLoginSuccess(data.payload, pinInput.value || getSavedPin(), data.social_info, data.username, data.userID);
                break;
            case 'message':
            case 'encrypted_message':
            case 'attachment':
                const isGlobal = (data.recipientID === 0 || data.recipientID === undefined);
                // Robust ID comparison using loose equality or String()
                const convId = isGlobal ? 0 : (String(data.senderID) === String(myUserID) ? data.recipientID : data.senderID);

                if (!conversations[convId]) {
                    const u = idToUserMap[convId];
                    const entryName = userAliases[convId] || (u ? u.name : `User #${convId}`);
                    conversations[convId] = {
                        messages: [],
                        name: isGlobal ? 'Global Broadcast' : entryName,
                        topOffset: -1,
                        isLoading: false,
                        allLoaded: false
                    };
                }

                const conv = conversations[convId];
                let payload = data.payload;
                if (data.type === 'encrypted_message' && myKeyPair) {
                    try {
                        const isMe = (String(data.senderID) === String(myUserID));
                        payload = await decryptHybrid(data.payload, myKeyPair.privateKey, isMe);
                        data.payload = payload; // Store decrypted version
                    } catch (err) {
                        console.error("Decryption failed", err);
                        payload = `[Decryption Failed]`;
                        data.payload = payload;
                    }
                }

                // De-duplicate check
                const isDuplicate = conv.messages.some(m =>
                    m.time === data.time &&
                    String(m.senderID) === String(data.senderID) &&
                    (data.type === 'attachment' ? (m.mediaID === data.mediaID) : (m.payload === payload))
                );

                if (!isDuplicate) {
                    conv.messages.push(data);
                }

                if (String(activeConversation) === String(convId)) {
                    if (data.type === 'attachment') {
                        renderAttachment(data.mediaID, data.mediaHash, data.senderID, false, false, data.time);
                    } else {
                        renderMessage(payload, data.senderID, false, false, data.time);
                    }
                }

                updateSidebarSnippet(convId, data.type === 'attachment' ? '[Attachment]' : payload, data.senderID, data.time);
                sortConversations();
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
                    publicKeyCache[data.userId] = key;
                    if (pendingKeyRequests[data.userId]) {
                        const reqs = pendingKeyRequests[data.userId];
                        delete pendingKeyRequests[data.userId];
                        reqs.forEach(([resolve]) => resolve(key));
                    }
                } catch (err) {
                    console.error("Failed to import peer public key", err);
                }
                break;
            case 'history':
                handleHistoryResponse(data);
                break;
            case 'last_messages_response':
                handleLastMessagesResponse(data.data);
                break;
            case 'system':
                const sysText = data.payload || data.message;
                if (!conversations[0]) {
                    conversations[0] = { messages: [], name: 'Global Broadcast', topOffset: -1, isLoading: false, allLoaded: false };
                }
                const sysMsg = { payload: sysText, senderID: 0, recipientID: 0, time: data.time || Date.now() / 1000, type: 'system' };

                if (!conversations[0].messages.some(m => m.time === sysMsg.time && m.payload === sysMsg.payload)) {
                    conversations[0].messages.push(sysMsg);
                }

                if (activeConversation === 0) {
                    renderMessage(sysText, 0, false, false, sysMsg.time);
                }
                updateSidebarSnippet(0, sysText, 0, sysMsg.time);
                sortConversations();
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
    const targetConvId = activeConversation;
    const conv = conversations[String(targetConvId)];
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
                const isHistoryMe = (m.senderID === myUserID);
                m.payload = await decryptHybrid(m.payload, myKeyPair.privateKey, isHistoryMe);
            } catch (err) {
                console.error("History decryption failed", err);
                m.payload = `[History Decryption Failed]`;
            }
        }

        const isDuplicate = conv.messages.some(existing =>
            existing.time === m.time &&
            String(existing.senderID) === String(m.senderID) &&
            (m.type === 'attachment' ? (existing.mediaID === m.mediaID) : (existing.payload === m.payload))
        );

        if (!isDuplicate) {
            decryptedNewMsgs.push(m);
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

        const isGlobal = (activeConversation === 0);

        if (isGlobal) {
            sendBinary({ type: 'message', payload: text });
        } else {
            try {
                // E2E Encryption Flow (Dual-Wrap for Sender + Recipient)
                const recipientPubKey = await fetchPeerPublicKey(activeConversation);
                const encryptedPayload = await encryptHybrid(text, recipientPubKey, myKeyPair.publicKey);

                sendBinary({
                    type: 'encrypted_private_message',
                    recipientID: activeConversation,
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

    document.getElementById('active-chat-name').onclick = () => {
        if (activeConversation === 0) return; // Can't rename Global
        const currentName = document.getElementById('active-chat-name').textContent;
        const newAlias = prompt("Enter a nickname for this user:", currentName);
        if (newAlias !== null) {
            setChatAlias(activeConversation, newAlias);
        }
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

    // --- File Attachment Handler ---
    const fileInput = document.getElementById('dm-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Basic validation
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (!isImage && !isVideo) {
                alert("Only images and videos are allowed.");
                fileInput.value = '';
                return;
            }

            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                alert("File is too large (max 50MB).");
                fileInput.value = '';
                return;
            }

            try {
                const formData = new FormData();
                formData.append('file', file);

                const resp = await fetch('worker/ChatAttachment.php', {
                    method: 'POST',
                    body: formData
                });
                const result = await resp.json();

                if (result.success) {
                    sendBinary({
                        type: 'attachment',
                        recipientID: activeConversation,
                        mediaID: result.media_id,
                        mediaHash: result.media_hash
                    });
                } else {
                    alert("Upload failed: " + result.message);
                }
            } catch (err) {
                console.error("Attachment upload error:", err);
                alert("External error during upload.");
            }

            fileInput.value = ''; // Reset
        });
    }

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
                    sendBinary({ type: 'load_history', limit: 30, beforeOffset: pointer, targetID: activeConversation });
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

function getUrlParam(name) {
    const results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results == null) return null;
    return decodeURI(results[1]) || 0;
}

function initDarkChat() {
    messagesDiv = document.getElementById('messages');
    input = document.getElementById('message-input');
    sendBtn = document.getElementById('send-btn');
    authOverlay = document.getElementById('auth-overlay');
    loginBtn = document.getElementById('login-btn');
    pinInput = document.getElementById('pin-input');
    authMsg = document.getElementById('auth-msg');
    inputArea = document.querySelector('.dm-input-area');

    if (!messagesDiv) return;

    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        // --- SPA RESTORATION ---
        // If already connected, we need to re-render the sidebar because the DOM was replaced
        refreshChatUI();

        // Check for URL ID parameter change
        const targetId = getUrlParam('id');
        if (targetId) {
            const fid = parseInt(targetId);
            if (idToUserMap[fid]) {
                const u = idToUserMap[fid];
                selectConversation(fid, u.name, u.pfpId, u.pfpHash, true);
            }
        }
        return;
    }

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

        // Check for direct chat ID
        const targetId = getUrlParam('id');
        if (targetId) {
            const fid = parseInt(targetId);
            // If we already have the user in map (unlikely on first load before fetchFriends, 
            // but possible if returning to page)
            if (idToUserMap[fid]) {
                const u = idToUserMap[fid];
                selectConversation(fid, u.name, u.pfpId, u.pfpHash, true); // skipPush: true
            }
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


function renderMessage(text, senderID = 0, prepend = false, skipScroll = false, timestamp = null) {
    if (!messagesDiv) return;

    // Standardize comparison to handle both number and string IDs
    const isMe = (senderID != 0 && String(senderID) === String(myUserID));
    const isStacked = (!prepend && String(senderID) === String(lastRenderedSenderID));

    if (!prepend) lastRenderedSenderID = senderID;

    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${isMe ? 'me' : 'them'} ${isStacked ? 'stacked' : ''}`;

    if (!isMe && !isStacked) {
        const sender = document.createElement('div');
        sender.className = 'message-sender';
        if (senderID == 0) {
            sender.textContent = 'SYSTEM';
        } else {
            const u = idToUserMap[senderID];
            sender.textContent = (u && u.name) ? u.name : `User #${senderID}`;
        }
        wrapper.appendChild(sender);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    const meta = document.createElement('div');
    meta.className = `msg-meta ${isMe ? 'me' : 'them'}`;
    const timeToDisplay = timestamp ? new Date(timestamp * 1000) : new Date();
    const timeStr = timeToDisplay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    meta.textContent = `${timeStr}`;

    const row = document.createElement('div');
    row.className = 'bubble-row';

    if (isMe) {
        row.appendChild(meta);
        row.appendChild(bubble);
    } else {
        row.appendChild(bubble);
        row.appendChild(meta);
    }

    wrapper.appendChild(row);

    if (prepend) {
        messagesDiv.insertBefore(wrapper, messagesDiv.firstChild);
    } else {
        // Smart Auto-Scroll Check
        const threshold = 250;
        const isNearBottom = (messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight) <= threshold;

        messagesDiv.appendChild(wrapper);

        if (!skipScroll) {
            const isWidget = document.getElementById('messenger-container').classList.contains('widget-mode');
            if (isMe || isNearBottom || isWidget) {
                scrollToBottom(true);
            }
        }
    }
}

function renderAttachment(mediaID, mediaHash, senderID = 0, prepend = false, skipScroll = false, timestamp = null) {
    if (!messagesDiv) return;

    const isMe = (senderID != 0 && String(senderID) === String(myUserID));
    const isStacked = (!prepend && String(senderID) === String(lastRenderedSenderID));

    if (!prepend) lastRenderedSenderID = senderID;

    const wrapper = document.createElement('div');
    wrapper.className = `msg-wrapper ${isMe ? 'me' : 'them'} ${isStacked ? 'stacked' : ''}`;

    if (!isMe && !isStacked) {
        const sender = document.createElement('div');
        sender.className = 'message-sender';
        if (senderID == 0) {
            sender.textContent = 'SYSTEM';
        } else {
            const u = idToUserMap[senderID];
            sender.textContent = (u && u.name) ? u.name : `User #${senderID}`;
        }
        wrapper.appendChild(sender);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.style.padding = '5px'; // Less padding for media

    // Media element detection (we don't know mime here but we can try image first)
    // Actually our backend returns is_video in upload response but we need it for received messages
    // We can use a helper or just try displaying as image and fallback to video if it fails or use a generic loader
    // For simplicity, I'll use the data/images.php and data/videos.php loaders

    // We'll check the media info if possible, but for now we'll assume it's an image and provide a video fallback link
    // Better: let's use a generic media container that can handle both
    const mediaContainer = document.createElement('div');

    // Create image element
    const img = document.createElement('img');
    img.src = `data/images.php?t=image&id=${mediaID}&h=${mediaHash}`;
    img.className = 'attachment-preview';
    img.style.cursor = 'pointer';
    img.onclick = () => window.open(img.src, '_blank');

    // Attempt to handle videos by checking format or just providing a link if it looks like one
    // Since we don't have format in the protocol yet, we'll try to load as image and if it fails, try video
    img.onerror = () => {
        img.style.display = 'none';
        const video = document.createElement('video');
        video.src = `data/videos.php?t=video&id=${mediaID}&h=${mediaHash}`;
        video.controls = true;
        video.className = 'attachment-preview';
        mediaContainer.appendChild(video);
    };

    mediaContainer.appendChild(img);
    bubble.appendChild(mediaContainer);

    const meta = document.createElement('div');
    meta.className = `msg-meta ${isMe ? 'me' : 'them'}`;
    const timeToDisplay = timestamp ? new Date(timestamp * 1000) : new Date();
    const timeStr = timeToDisplay.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    meta.textContent = `${timeStr}`;

    const row = document.createElement('div');
    row.className = 'bubble-row';

    if (isMe) {
        row.appendChild(meta);
        row.appendChild(bubble);
    } else {
        row.appendChild(bubble);
        row.appendChild(meta);
    }

    wrapper.appendChild(row);

    if (prepend) {
        messagesDiv.insertBefore(wrapper, messagesDiv.firstChild);
    } else {
        const threshold = 250;
        const isNearBottom = (messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight) <= threshold;
        messagesDiv.appendChild(wrapper);
        if (!skipScroll) {
            const isWidget = document.getElementById('messenger-container').classList.contains('widget-mode');
            if (isMe || isNearBottom || isWidget) scrollToBottom(true);
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
            const targets = [0]; // 0 = global
            myFriends.forEach(f => {
                const fid = parseInt(f.user_id);
                idToUserMap[fid] = {
                    nickname: f.user_nickname,
                    name: f.user_firstname + ' ' + f.user_lastname,
                    pfpId: f.pfp_media_id,
                    pfpHash: f.pfp_media_hash,
                    verified: f.verified
                };
                addConversationToSidebar(f);
                targets.push(fid);
            });

            // Batch fetch last messages (using UserIDs)
            if (ws && ws.readyState === WebSocket.OPEN) {
                sendBinary({ type: 'get_last_messages', targets: targets });
            }
            renderFriends(myFriends);

            // Handle direct chat from URL parameter now that we have names/PFPs
            const targetId = getUrlParam('id');
            if (targetId) {
                const fid = parseInt(targetId);
                if (idToUserMap[fid]) {
                    const u = idToUserMap[fid];
                    selectConversation(fid, u.name, u.pfpId, u.pfpHash, true); // skipPush: true
                }
            }
        }
    } catch (e) {
        console.error("Failed to fetch friends:", e);
    }
}

/**
 * Re-renders the UI from cached data. 
 * Essential for SPA navigation where the DOM is replaced but JS objects persist.
 */
function refreshChatUI() {
    console.log("Refreshing Chat UI (SPA Restore)");

    // 1. Re-render Sidebar
    const list = document.getElementById('conv-list');
    if (list) {
        // Clear all but the Global item if it exists, or just clear all
        list.innerHTML = `
            <div class="conversation-item active" id="conv-0" onclick="selectConversation(0, 'Global Broadcast')">
                <div class="avatar-small system-avatar">G</div>
                <div class="conv-info">
                    <div class="conv-name">Global Broadcast</div>
                    <div class="conv-last-msg" id="last-msg-0">Initial Global Stream...</div>
                </div>
            </div>
        `;

        myFriends.forEach(friend => {
            addConversationToSidebar(friend);
        });
    }

    // 2. Re-Setup Handlers (SPA replaces the elements we bound to)
    setupUiHandlers();

    // 3. Re-request Snippets for the sidebar items we just created
    if (myFriends.length > 0) {
        const targets = [0, ...myFriends.map(f => parseInt(f.user_id))];
        sendBinary({ type: 'get_last_messages', targets: targets });
    }

    // 4. Force scroll to bottom of current active chat
    scrollToBottom(false);
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
        const fid = parseInt(friend.user_id);
        item.onclick = () => {
            selectConversation(fid, friend.user_firstname + ' ' + friend.user_lastname, friend.pfp_media_id, friend.pfp_media_hash);
            document.getElementById('modal-user-picker').classList.add('hidden');
            // Ensure sidebar item exists
            if (!document.getElementById(`conv-${fid}`)) {
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
    const fid = parseInt(friend.user_id);
    const existing = document.getElementById(`conv-${fid}`);
    if (existing) return;

    const div = document.createElement('div');
    div.className = 'conversation-item';
    div.id = `conv-${fid}`;
    div.dataset.timestamp = "0";

    const fullName = friend.user_firstname + ' ' + friend.user_lastname;
    const displayName = userAliases[fid] || fullName;

    div.onclick = () => selectConversation(fid, fullName, friend.pfp_media_id, friend.pfp_media_hash);

    const img = document.createElement('img');
    img.className = 'avatar-small';
    img.src = friend.pfp_media_id > 0 ? `data/images.php?t=profile&id=${friend.pfp_media_id}&h=${friend.pfp_media_hash}` : 'data/blank.jpg';

    const info = document.createElement('div');
    info.className = 'conv-info';

    const name = document.createElement('div');
    name.className = 'conv-name';
    name.innerHTML = `<span class="name-text" data-original-name="${fullName}">${displayName}</span> ${getVerifiedBadge(friend.verified)}`;

    const lastMsg = document.createElement('div');
    lastMsg.className = 'conv-last-msg';
    lastMsg.id = `last-msg-${fid}`;
    lastMsg.textContent = '...';

    info.appendChild(name);
    info.appendChild(lastMsg);
    div.appendChild(img);
    div.appendChild(info);

    // Insert after Global
    const globalConv = document.getElementById('conv-0');
    if (globalConv && globalConv.nextSibling) {
        list.insertBefore(div, globalConv.nextSibling);
    } else {
        list.appendChild(div);
    }
}

function setChatAlias(userId, alias) {
    if (!alias || alias.trim() === '') {
        delete userAliases[userId];
    } else {
        userAliases[userId] = alias.trim();
    }
    localStorage.setItem('chat_aliases', JSON.stringify(userAliases));

    // Update Header if currently active
    if (String(activeConversation) === String(userId)) {
        document.getElementById('active-chat-name').textContent = alias || "User #" + userId;
    }

    // Update Sidebar Item
    const sideItem = document.getElementById(`conv-${userId}`);
    if (sideItem) {
        const nameEl = sideItem.querySelector('.name-text');
        if (nameEl) nameEl.textContent = alias || nameEl.dataset.originalName || "User #" + userId;
    }

    // Update In-Memory conversations if present
    if (conversations[userId]) {
        conversations[userId].name = alias || conversations[userId].name;
    }
}

function updateSidebarSnippet(convId, payload, senderID, timestamp = null) {
    const el = document.getElementById(`last-msg-${convId}`);
    if (el) {
        let text = payload;
        if (typeof payload === 'string' && payload.length > 30) {
            text = payload.substring(0, 27) + '...';
        }
        const isMe = (senderID === myUserID);
        el.textContent = (isMe ? 'You: ' : '') + text;

        // Update timestamp for sorting
        if (timestamp) {
            const item = document.getElementById(`conv-${convId}`);
            if (item) item.dataset.timestamp = timestamp;
        }
    }
}

async function handleLastMessagesResponse(data) {
    for (const [targetID, msg] of Object.entries(data)) {
        let payload = msg.payload;
        const isMe = (msg.senderID === myUserID);

        if (msg.type === 'encrypted_message' && myKeyPair) {
            try {
                payload = await decryptHybrid(msg.payload, myKeyPair.privateKey, isMe);
            } catch (err) {
                payload = "[Encrypted]";
            }
        }
        updateSidebarSnippet(targetID, payload, msg.senderID, msg.time);
    }
    sortConversations();
}

function sortConversations() {
    const list = document.getElementById('conv-list');
    if (!list) return;

    const items = Array.from(list.querySelectorAll('.conversation-item'));
    items.sort((a, b) => {
        const tsA = parseInt(a.dataset.timestamp || 0);
        const tsB = parseInt(b.dataset.timestamp || 0);
        return tsB - tsA; // Latest first
    });

    // Re-append in order
    items.forEach(item => list.appendChild(item));
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

function getVerifiedBadge(level, style = "", customTitle = null) {
    if (level <= 0) return "";
    let icon = "fa-badge-check";
    // Check if i18n is available, if not use fallback titles
    let title = customTitle;
    if (!title) {
        if (typeof i18n !== 'undefined' && typeof i18n.t === 'function') {
            title = i18n.t("lang_badge_" + level) || i18n.t("lang__016");
        } else {
            const fallbacks = { 1: "Verified User", 2: "VIP Member", 20: "Administrator" };
            title = fallbacks[level] || "Verified";
        }
    }
    if (level == 20) icon = "fa-paw-claws";

    return `<i class="fa-solid ${icon} verified_color_${level} verified-badge" style="${style}" title="${title}"></i>`;
}
