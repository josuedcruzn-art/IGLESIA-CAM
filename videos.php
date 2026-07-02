<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$db_file = __DIR__ . '/db.json';
$uploads_dir = __DIR__ . '/../uploads';
$videos_dir = $uploads_dir . '/videos';
$thumbnails_dir = $uploads_dir . '/thumbnails';

// Ensure uploads directories exist
foreach ([$uploads_dir, $videos_dir, $thumbnails_dir] as $dir) {
    if (!file_exists($dir)) {
        mkdir($dir, 0755, true);
    }
    if (is_dir($dir)) {
        chmod($dir, 0755);
    }
}

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

function move_uploaded_file_safely($tmp_path, $target_path) {
    if (is_uploaded_file($tmp_path) && move_uploaded_file($tmp_path, $target_path)) {
        return true;
    }

    if (file_exists($tmp_path) && copy($tmp_path, $target_path)) {
        return true;
    }

    return false;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $db = read_db($db_file);
    echo json_encode($db['videos']);
    exit;
}

if ($method === 'POST') {
    $title = isset($_POST['title']) ? trim($_POST['title']) : 'Video sin título';
    $description = isset($_POST['description']) ? trim($_POST['description']) : '';
    $category = isset($_POST['category']) ? trim($_POST['category']) : 'sermon';

    $videoUrl = 'uploads/videos/default-sermon.mp4';
    $thumbnailUrl = 'uploads/thumbnails/default-sermon.jpg';

    $timestamp = round(microtime(true) * 1000);

    // Process Video File Upload
    if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
        $file_tmp = $_FILES['video']['tmp_name'];
        $file_name = $_FILES['video']['name'];
        $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        
        // Sanitize ext
        if (empty($ext)) {
            $ext = 'mp4';
        }
        
        $new_filename = $timestamp . '_video.' . $ext;
        $target_path = $videos_dir . '/' . $new_filename;

        if (move_uploaded_file_safely($file_tmp, $target_path)) {
            chmod($target_path, 0644);
            $videoUrl = 'uploads/videos/' . $new_filename;
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al guardar el archivo de video en el servidor']);
            exit;
        }
    }

    // Process Thumbnail File Upload
    if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
        $file_tmp = $_FILES['thumbnail']['tmp_name'];
        $file_name = $_FILES['thumbnail']['name'];
        $ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
        
        // Sanitize ext
        if (empty($ext)) {
            $ext = 'jpg';
        }

        $new_filename = $timestamp . '_thumbnail.' . $ext;
        $target_path = $thumbnails_dir . '/' . $new_filename;

        if (move_uploaded_file_safely($file_tmp, $target_path)) {
            chmod($target_path, 0644);
            $thumbnailUrl = 'uploads/thumbnails/' . $new_filename;
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Error al guardar el archivo de miniatura en el servidor']);
            exit;
        }
    }

    $db = read_db($db_file);

    $new_video = [
        'id' => 'vid-' . $timestamp,
        'title' => $title,
        'description' => $description,
        'category' => $category,
        'videoUrl' => $videoUrl,
        'thumbnailUrl' => $thumbnailUrl,
        'date' => date('c')
    ];

    // Prepend to array
    array_unshift($db['videos'], $new_video);

    $write_result = write_db_if_possible($db_file, $db);

    if ($write_result['ok']) {
        http_response_code(201);
        echo json_encode(['success' => true, 'video' => $new_video]);
    } else {
        http_response_code(201);
        echo json_encode(['success' => true, 'video' => $new_video, 'warning' => $write_result['error']]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Método no permitido']);
exit;
