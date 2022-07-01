Files I use to have the [IKEA SYMFONISK sound remote](https://www.ikea.com/nl/en/p/symfonisk-sound-remote-white-60370480/) as a dimmer for an [IKEA TRÅDFRI led-lamp](https://www.ikea.com/nl/en/p/tradfri-led-bulb-e27-806-lumen-wireless-dimmable-warm-white-globe-opal-white-90408797/).

Rotate to dim the light. Single press to turn on/off, double press to turn on with dimmest setting, triple press to turn the light on with the brightest setting.

Docker compose starts zigbee2mqtt, mosquitto, node-red and the script. Node-red is not required for it to work.

See script/index.js for the actual script that does the work.

Note: You need a [zigbee2mqtt compatible adapter](https://www.zigbee2mqtt.io/guide/adapters/#recommended) in order to get things working.
