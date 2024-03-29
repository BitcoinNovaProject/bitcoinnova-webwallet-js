<?php
/**
 * Copyright (c) 2018, Gnock
 * Copyright (c) 2018, The Masari Project
 * Copyright (c) 2018, The Bitcoinnova Project
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

include 'config.php';

$curl = curl_init();
$body = json_encode(array("jsonrpc" => "2.0", "id" => "0", "method" => "f_on_transactions_pool_json", "params" => ''));
curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://'.$daemonAddress.':'.$rpcPort.'/json_rpc', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => $body));
$resp = curl_exec($curl);

//now get the Tx details
$jsonMempool = json_decode($resp, true);
$rawTransactions = $jsonMempool["result"]["transactions"];
$txHashes = array();
for($iTransaction = 0; $iTransaction < count($rawTransactions); ++$iTransaction){
	$txHashes[] = $rawTransactions[$iTransaction]["hash"];
}

$body = json_encode(array(
			'transactionHashes'=>$txHashes
));
curl_setopt_array($curl, array(CURLOPT_RETURNTRANSFER => 1, CURLOPT_URL => 'http://'.$daemonAddress.':'.$rpcPort.'/get_transaction_details_by_hashes', CURLOPT_POST => 1, CURLOPT_POSTFIELDS => $body));
$resp = curl_exec($curl);
$decodedJson = json_decode($resp, true);
curl_close($curl);

/*
$blobString1 = '"tx_blob": "';
$blobString2 = '"tx_blob":"';
$posTxBlob = 0;
$searchTxBlock1 = 0;
$searchTxBlock2 = 0;
while(($searchTxBlock1 = strpos($resp,$blobString1)) !== false || ($searchTxBlock2 = strpos($resp,$blobString2)) !== false ){
//	var_dump($searchTxBlock1.' '.$searchTxBlock2);
	if($searchTxBlock1 !== false){
		$posTxBlob = $searchTxBlock1;
		$posEndTxBlock = $posTxBlob + strlen($blobString1);
	}
	else if($searchTxBlock2 !== false){
		$posTxBlob = $searchTxBlock2;
		$posEndTxBlock = $posTxBlob + strlen($blobString2);
	}
	
	$i = 0;
	do{
		++$posEndTxBlock;
		$posEndTxBlock = strpos($resp, '"', $posEndTxBlock);
		++$i;
	}while($posEndTxBlock !== false && $resp[$posEndTxBlock-1] === '\\');
	
	$resp = substr($resp, 0, $posTxBlob).substr($resp, $posEndTxBlock+2);
}

$jsonMempool = json_decode($resp, true);
if(isset($jsonMempool["result"]['transactions'])){
//	var_dump('isset');
	foreach($jsonMempool['transactions'] as $key=>$tx){
		unset($tx['tx_blob']);
		$tx['tx_json'] = json_decode($tx['tx_json']);
		$jsonMempool['transactions'][$key] = $tx;
	}
}
*/
$jsonMempool = json_decode($resp, true);
header('Content-Type: application/json');
echo json_encode($jsonMempool['transactions']);

