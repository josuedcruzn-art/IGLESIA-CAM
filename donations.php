<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$db_file = __DIR__ . '/db.json';

// Utility helper to read database
function read_db($file) {
    if (!file_exists($file)) {
        return ['videos' => [], 'donations' => []];
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : ['videos' => [], 'donations' => []];
}

// Utility helper to write database with lock
function write_db($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function write_db_if_possible($file, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return ['ok' => false, 'error' => 'No se pudo serializar la información'];
    }

    $result = @file_put_contents($file, $json, LOCK_EX);
    if ($result !== false) {
        return ['ok' => true, 'error' => null];
    }

    return ['ok' => false, 'error' => 'El servidor no permite escribir en la base de datos'];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $db = read_db($db_file);
    echo json_encode($db['donations']);
    exit;
}

if ($method === 'POST') {
    // Read raw JSON body input
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'JSON inválido']);
        exit;
    }

    $donorName = isset($input['donorName']) ? trim($input['donorName']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $amount = isset($input['amount']) ? floatval($input['amount']) : 0;
    $paymentMethod = isset($input['paymentMethod']) ? trim($input['paymentMethod']) : '';

    if (empty($donorName) || empty($email) || $amount <= 0 || empty($paymentMethod)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Faltan campos obligatorios']);
        exit;
    }

    $db = read_db($db_file);

    $new_donation = [
        'id' => 'don-' . round(microtime(true) * 1000),
        'donorName' => $donorName,
        'email' => $email,
        'amount' => $amount,
        'paymentMethod' => $paymentMethod,
        'date' => date('c'),
        'status' => 'Completada'
    ];

    // Prepend to array
    array_unshift($db['donations'], $new_donation);

    $write_result = write_db_if_possible($db_file, $db);

    if ($write_result['ok']) {
        http_response_code(201);
        echo json_encode(['success' => true, 'donation' => $new_donation]);
    } else {
        http_response_code(201);
        echo json_encode(['success' => true, 'donation' => $new_donation, 'warning' => $write_result['error']]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido']);
exit;
