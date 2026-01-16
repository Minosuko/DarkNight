<?php
class CommandFunc{
	function __construct(){
		$this->db = $GLOBALS['conn'];
		$this->userData = null;
		$this->AllowCommand = [2,20];
	}
	public function setUserData($data){
		$this->userData = $data;
	}
	public function parse_command($command){
		$preg = preg_match('/\/([\w|\d]+) ([\w|\d]+)/', $command, $match);
		if(!$preg) return false;
		return [$match[1],$match[2]];
	}
	public function allowUseCommand(){
		$CommandAllowedVerified = $this->AllowCommand;
		if($this->userData == null)
			return false;
		$data = $this->userData;
		return in_array($data['verified'],$CommandAllowedVerified);
	}
	public function execute($command, $argument, $target){
		if($this->userData == null)
			return false;
		$data = $this->userData;
		$conn = $this->db;
		$CommandAllowedVerified = $this->AllowCommand;
		$command = strtolower($command);
		switch($command){
			case 'verify':
				if(!in_array($data['verified'],$CommandAllowedVerified))
					return false;
				if($data['user_id'] == $target)
					return false;
				if($argument >= $data['verified'])
					return false;
				if(!is_numeric($argument))
					return false;
				$sql = "UPDATE users SET verified = $argument WHERE user_id = $target";
				return $conn->query($sql);
				break;
			case 'allow_comment':
				if(!in_array($data['verified'],$CommandAllowedVerified))
					return false;
				if(!is_numeric($argument))
					return false;
				if(in_array($argument,[0,1]))
					return false;
				$sql = "UPDATE posts SET allow_comment = $argument WHERE post_id = $target";
				return $conn->query($sql);
				break;
			default:
				return false;
		}
		return true;
	}
}
?>