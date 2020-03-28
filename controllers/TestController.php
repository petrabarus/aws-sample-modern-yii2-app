<?php
namespace app\controllers;

use Yii;
use yii\filters\AccessControl;
use yii\web\Controller;

class TestController extends Controller {

    public function actionIndex($name = '') {
        $sessionId = Yii::$app->session->id;
        if (!empty($name)) {
            Yii::$app->session->set('name', $name);
        }
        $name = Yii::$app->session->get('name');
        return "My name is {$name}. My session ID is: {$sessionId}";
    }
}
