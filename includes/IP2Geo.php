<?php
require_once __DIR__ . '/classes/IP2Location.php';

class IP2Geo{
	private $reader;
	private $dbFile = __DIR__ . '/../data/geoip/IP2LOCATION-LITE-DB1.BIN';
	public $IP;
	public $validQuery = false;
	public $query = null;

	function __construct($IPAddress = null){
		if(file_exists($this->dbFile)){
			try {
				$this->reader = new IP2LocationReader($this->dbFile);
			} catch (Exception $e) {
				// Handle silently or log
			}
		}
		if($IPAddress != null)
			$this->changeIP($IPAddress);
	}

	private function queryIP($IPAddress){
		if(!$this->reader) return false;
		try {
			$data = $this->reader->lookup($IPAddress);
			return $data ? json_encode($data) : false;
		} catch (Exception $e) {
			return false;
		}
	}

	function changeIP($IPAddress){
		$this->IP = $IPAddress;
		$query = $this->queryIP($IPAddress);
		$this->validQuery = ($query !== false);
		$this->query = $this->validQuery ? json_decode($query, true) : null;
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
		// IP2Location returns country_name
		if(!isset($this->query['country_name'])) return false;
		return $this->query['country_name'];
	}

	function getCityRegionCountry(){
		if(!$this->validQuery) return false;
		$city = $this->getCity() ?: 'Unknown City';
		$region = $this->getRegion() ?: 'Unknown Region';
		$country = $this->getCountry() ?: 'Unknown Country';
		return $city.', '.$region.', '.$country;
	}
}
?>