const mqtt = require('mqtt')
const client  = mqtt.connect('mqtt://mosquitto')

const topicname = "zigbee2mqtt"

const dev_dimmer = "Dimmer"
const dev_lamp = "KleurenLamp"

var waitingForMessage = []
var brightnessMoving = "stop"

async function getState(device) {
    promise = new Promise((resolve, reject) => {
        waitingForMessage.push({promise: resolve, reject: reject, device: device, date: new Date().getTime()});
        client.publish(topicname+"/"+device+"/get", '{"state":""}');
    });
    return promise;
}

// Cleanup the array with old stuff
var interval = setInterval(function () {
  waitingForMessage.forEach(function(element, index, object) {
      if (element.date+1000 < new Date().getTime()) {
          console.log("ERR: Obj never finished");
          console.log(element);
          element.reject();
          object.splice(index, 1);
      }
  });
}, 1000);

async function resolveState(topic, message) {
  waitingForMessage.forEach(function(element, index, object) {
      if (topicname+"/"+element.device == topic) {
          element.promise(message);
          object.splice(index, 1);
      }
  });
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function handleLamp(msg) {
  obj = {
      "payload": {
      }
  };

  am = 60; 

  bmoving = brightnessMoving;


  if (msg.payload === null) {
      obj.payload.state = "OFF";
  }
  else if ( msg.payload_in.action === null ) {
    return null;
  }
  else if( msg.payload_in.action == "toggle") {
      if (msg.payload.state == "ON")
          obj.payload.state = "OFF";
      if (msg.payload.state == "OFF") {
          obj.payload.state = "ON";
      }
  }
  else if( msg.payload_in.action == "on") {
      obj.payload.state = "ON";
  }
  else if( msg.payload_in.action == "off") {
      obj.payload.state = "OFF";
  }
  else if( msg.payload_in.action == "brightness_move_up" && bmoving != "down" && msg.payload.state == "ON") {
      brightnessMoving = "up";
      obj.payload.brightness_move = am; 
  }
  else if( msg.payload_in.action == "brightness_move_down" && bmoving != "up" && msg.payload.state == "ON") {
      brightnessMoving = "down";
      obj.payload.brightness_move = -am;
  }
  else if( msg.payload_in.action == "brightness_stop" && msg.payload.state == "ON") {
      brightnessMoving = "stop";
      obj.payload.brightness_move = 0;
  }
  else if( msg.payload_in.action == "brightness_step_up") {
      obj.payload.brightness = 50; 
      obj.payload.state = "ON";
  }
  else if( msg.payload_in.action == "brightness_step_down") {
      obj.payload.brightness = 254;
      obj.payload.state = "ON";
  }

  if (msg.payload !== null && msg.payload.brightness == 1) {
      if (obj.payload.state == "OFF") {
          let p = {brightness: 10, transition: 0};
          await delay(200);
          client.publish(topicname+"/"+dev_lamp+"/set", JSON.stringify(p));
      }
      obj.payload.brightness = 10;
  }

  obj.payload.transition = 0;
  return obj;
}

client.on('connect', function () {
  client.subscribe('#', function (err) {
  })
})

client.on('message', async function (topic, message) {
  console.log(topic, message.toString())
  resolveState(topic, message);
  if (topic == topicname + "/" + dev_dimmer) {
    try {
      let state = await getState(dev_lamp);
      let msg = {payload_in: JSON.parse(message.toString()), payload: JSON.parse(state.toString())};
      let ret = await handleLamp(msg);
      console.log(ret);
      if (ret !== null) {
        client.publish(topicname+"/"+dev_lamp+"/set", JSON.stringify(ret.payload));
      }
    } catch (err) {
      console.log(err);
    }
  }
})

process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    clearInterval(interval);
    client.end();
});

