<?php
class IP2Geo{
	function __construct($IPAddress){
		$this->changeIP($IPAddress);
	}
	private function queryIP($IPAddress){
		$options = 
		[
			CURLOPT_CONNECTTIMEOUT		=> 900,
			CURLOPT_TIMEOUT				=> 900,
			CURLOPT_HEADER				=> false,
			CURLOPT_CUSTOMREQUEST		=> "GET",
			CURLOPT_FOLLOWLOCATION		=> true,
			CURLOPT_RETURNTRANSFER		=> true,
			CURLOPT_USERAGENT			=> "DarkNight_IP2GeoAPI",
			CURLOPT_SSL_VERIFYPEER		=> false
		];
		$ch = curl_init("https://ipinfo.io/$IPAddress");
		curl_setopt_array($ch, $options);
		$content = curl_exec($ch);
		curl_close($ch);
		return $content;
	}
	function changeIP($IPAddress){
		$this->IP = $IPAddress;
		$query = $this->queryIP($IPAddress);
		$this->validQuery = is_array(@json_decode($query, true));
		$this->query = $this->validQuery ? json_decode($query,true) : null;
		return $this->validQuery;
	}
	function getTimeZone(){
		if(!$this->validQuery) return false;
		if(!isset($this->query['timezone'])) return false;
		return $this->query['timezone'];
	}
	function getCity(){
		if(!$this->validQuery) return false;
		if(!isset($this->query['city'])) return false;
		return $this->query['city'];
	}
	function getRegion(){
		if(!$this->validQuery) return false;
		if(!isset($this->query['region'])) return false;
		return $this->query['region'];
	}
	function getCountry(){
		if(!$this->validQuery) return false;
		if(!isset($this->query['country'])) return false;
		return $this->query['country'];
	}
	function getCityRegionCountry(){
		if(!$this->validQuery) return false;
		if(!isset($this->query['region'])) return false;
		if(!isset($this->query['city'])) return false;
		if(!isset($this->query['country'])) return false;
		return $this->query['city'].', '.$this->query['region'].', '.$this->query['country'];
	}
}
?>