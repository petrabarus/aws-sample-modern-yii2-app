<?php

namespace app\components;

use yii\web\Session as BaseSession;
use Aws\DynamoDb\DynamoDbClient;

class Session extends BaseSession {

    private $client;

    public $clientConfigs = [];
    
    public $sessionConfigs = [];

    public function init()
    {
        $this->createDynamoDbClient();
        parent::init();
    }

    protected function registerSessionHandler()
    {
        $configs = array_filter($this->sessionConfigs);
        $this->handler = $this->client->registerSessionHandler($configs);
        parent::registerSessionHandler();
    }

    private function createDynamoDbClient()
    {
        $configs = array_filter($this->clientConfigs);
        $this->client = new DynamoDbClient($configs);
    }
}
