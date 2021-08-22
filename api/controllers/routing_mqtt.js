'use strict';

const THIS_BASE_PATH = process.env.THIS_BASE_PATH;
const CONTROLLERS_BASE = THIS_BASE_PATH + '/api/controllers/';
const MQTT_TARGET_FNAME = "mqtt.json";

const DEFAULT_HANDLER = "handler";
const broker = process.env.MQTT_BROKER_URL;

const fs = require('fs');
const mqtt = require('mqtt')

let mqtt_client;

function parse_mqtt() {
  if( broker ){
    let topic_list = [];
    mqtt_client = mqtt.connect(broker);
    mqtt_client.on('connect', () =>{
      // mqtt.jsonの検索
      const folders = fs.readdirSync(CONTROLLERS_BASE);
      folders.forEach(folder => {
        if( !fs.existsSync(CONTROLLERS_BASE + folder) )
          return;
        const stats_dir = fs.statSync(CONTROLLERS_BASE + folder);
        if (!stats_dir.isDirectory())
          return;

        try {
          const fname = CONTROLLERS_BASE + folder + "/" + MQTT_TARGET_FNAME;
          if( !fs.existsSync(fname) )
            return;
          const stats_file = fs.statSync(fname);
          if (!stats_file.isFile())
            return;

          const defs = JSON.parse(fs.readFileSync(fname).toString());
          defs.forEach(item =>{
            // topicの検索
            if( !item.topic )
              return;

            const handler = item.handler || DEFAULT_HANDLER;
            const proc = require('./' + folder)[handler];

            topic_list.push({
              topic: item.topic,
              regexp: new RegExp(item.topic.replace(/#/g, '[^/]+')),
              proc: proc,
              isBase64Encoded: item.isBase64Encoded ? true : false
            } );

            mqtt_client.subscribe(item.topic, () =>{
              console.log(item.topic + " mqtt " + handler);
            });
          });

        } catch (error) {
          console.log(error);
        }
      });
    });

    mqtt_client.on('message', (topic, message) => {
      topic_list.forEach( item => {
        // topicの判別
        try{
          var result = topic.match(item.regexp);
          if(result){
            var context = { topic: topic, mqtt: mqtt_client, isBase64Encoded: item.isBase64Encoded };
            if (item.isBase64Encoded )
              item.proc(message.toString('base64'), context);
            else
              item.proc(message.toString(), context);
          }
        }catch(error){
          console.log(error);
        }
      });
    });
  }
}

module.exports = parse_mqtt();
