<?php

$testnet = false;
$cacheLocation = __DIR__.'/'.($testnet ? 'cache-testnet' : 'cache');
$daemonAddress = '127.0.0.1';
$rpcPort = $testnet ? 45223 : 45223;
$coinSymbol = 'btn';
