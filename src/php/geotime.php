<?
  if ($_GET["latitude"] && $_GET["longitude"]) {
    $data = file_get_contents("http://www.earthtools.org/timezone/" . 
      $_GET["latitude"] . "/" . $_GET["longitude"]);

    $xml = simplexml_load_string($data);
    try {
      $date = new DateTime($xml->isotime);
      $time = $date->format("H:i:s");
      $output = array(
        "ok" => 1,
        "time" => $time,
        );
    } catch (Exception $e) {
      $output = array(
        "ok" => 0,
        "error" => "Error: ". $e,
        );
    }
  } else {
      $output = array(
        "ok" => 0,
        "error" => "Error: No latitude and/or longitude.",
        );
  }

  print_r(json_encode($output));
?>
