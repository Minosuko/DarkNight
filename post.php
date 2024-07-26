<?php 
// Check whether user is logged on or not
if (!isset($_COOKIE['token']))
	header("location:index.php");
require_once 'includes/functions.php';
if (!_is_session_valid($_COOKIE['token']))
	header("location:index.php");
$data = _get_data_from_token($_COOKIE['token']);
if(isset($_GET['id'])){
	if(is_numeric($_GET['id']))
		$id = $_GET['id'];
	else
		header("location:home.php");
}else{
	header("location:home.php");
}
?>

<!DOCTYPE html>
<html>
	<head>
		<title>Social Network</title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" type="text/css" href="resources/css/main.css">
		<link rel="stylesheet" type="text/css" href="resources/css/font-awesome/all.css">
		<link rel="stylesheet" type="text/css" href="resources/css/highlight/highlight.css">
		<link rel="stylesheet" type="text/css" href="resources/css/cropper/cropper.css">
		<style>
			.caption_box_shadow{
				width: 96.2%;
			}
			.caption_box pre{
				width: 100%;
			}
		</style>
	</head>
	<body>
		<div class="container">
			<?php include 'includes/navbar.php'; ?>
			<input type="hidden" id="page" value="0">
			<div id="image_content">
				<center>
					<div class="left_content" id="_content_left">
						<img class="content-pic" id="picture" />
						<video class="content-vid" id="video" controls></video>
					</div>
				</center>
				<div class="right_content" id="_content_right">
					
				</div>
			</div>
		</div>
		<script>
			_load_post(<?php echo $id; ?>);
			function _post_feed(){
				var file_data = document.getElementById("imagefile");
				var is_private = document.getElementById('private').value;
				var form_data = new FormData();
				form_data.append("post", 'post');
				form_data.append("private", is_private);
				form_data.append("caption", document.getElementsByTagName("textarea")[0].value);
				if(file_data.files.length > 0)
					form_data.append("fileUpload", file_data.files[0]);
				$.ajax({
					type: "POST",
					url: "/worker/post.php",
					processData: false,
					mimeType: "multipart/form-data",
					contentType: false,
					data: form_data,
					success: function (response) {
						setTimeout(null,100);
						fetch_post("fetch_post.php");
					}
				});
			}
			function _share_feed(){
				var file_data = document.getElementById("imagefile");
				var is_private = document.getElementById('private').value;
				var post_id = document.getElementById('post_id').value;
				var form_data = new FormData();
				form_data.append("post", 'post');
				form_data.append("private", is_private);
				form_data.append("post_id", post_id);
				form_data.append("caption", document.getElementsByTagName("textarea")[0].value);
				if(file_data.files.length > 0)
					form_data.append("fileUpload", file_data.files[0]);
				$.ajax({
					type: "POST",
					url: "/worker/share.php",
					processData: false,
					mimeType: "multipart/form-data",
					contentType: false,
					data: form_data,
					success: function (response) {
						var id = document.getElementById('post_id').value;
						var splt = data.split(";");
						zTemplate(document.getElementById("post-share-count-" + id), {
							"counter": parseInt(splt[1])
						});
						setTimeout(null,100);
						fetch_post("fetch_post.php");
					}
				});
			}
			function validatePost(type){
				var required = document.getElementsByClassName("required");
				var caption = document.getElementsByTagName("textarea")[0].value;
				required[0].style.display = "none";
				if(caption == ""){
					required[0].style.display = "initial";
					return false;
				}
				if(type == 0)
					_post_feed();
				else
					_share_feed();
				document.getElementById("imagefile").value = null;
				caption.value = '';
				document.getElementById("imagefile").style.display = 'none';
				modal_close();
				return false;
			}
		</script>
	</body>
</html>