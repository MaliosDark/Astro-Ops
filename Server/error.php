<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bonk Raiders - Server Error</title>
    <style>
        body {
            font-family: 'Press Start 2P', monospace;
            background: #000;
            color: #0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .error-container {
            background: rgba(0, 40, 0, 0.8);
            border: 4px solid #0f0;
            border-radius: 8px;
            padding: 20px;
            max-width: 500px;
        }
        h1 {
            color: #f00;
            font-size: 24px;
            margin-bottom: 20px;
        }
        p {
            font-size: 12px;
            line-height: 1.5;
            margin-bottom: 20px;
        }
        .retry-btn {
            background: rgba(0, 20, 0, 0.7);
            border: 2px solid #0f0;
            color: #0f0;
            padding: 10px 20px;
            font-family: 'Press Start 2P', monospace;
            font-size: 12px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .retry-btn:hover {
            background: rgba(0, 20, 0, 1);
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>SERVER ERROR</h1>
        <p>The Bonk Raiders server encountered an internal error.</p>
        <p>Please try again in a few moments.</p>
        <a href="/" class="retry-btn">RETRY</a>
    </div>
</body>
</html>