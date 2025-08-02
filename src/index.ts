import {ServerSocket} from './core/WebSocketServer';
import {WebSocketClient} from './core/WebSocketClient';

const server = ServerSocket.getInstance()
server.start();

const client = WebSocketClient.getInstance();
client.connect();
