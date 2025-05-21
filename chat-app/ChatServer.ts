import { Context } from "@oak/oak";

type WebSocketWithUsername = WebSocket & { username: string };
type AppEvent = { event: string;[key: string]: any };
type Room = {
	name: string;
	isPublic: boolean;
	password?: string;
	roomMember: WebSocketWithUsername[];
};

export default class ChatServer {
	private connectedClients = new Map<string, WebSocketWithUsername>();
	private listRoom = new Map<string, Room>();

	constructor() {
		const publicRoom: Room = {
			name: "Public Room",
			isPublic: true,
			roomMember: [],
		};
		this.listRoom.set("Public Room", publicRoom);
	};

	public async handleConnection(ctx: Context) {
		const socket = await ctx.upgrade() as WebSocketWithUsername;
		const username = ctx.request.url.searchParams.get("username");

		if (this.connectedClients.has(username)) {
			socket.close(1008, `Username ${username} is already taken`);
			return;
		}

		socket.username = username;
		this.listRoom.get("Public Room")?.roomMember.push(socket);

		socket.onopen = () => {
			this.broadcastUsernames();
		}
		socket.onclose = () => {
			this.clientDisconnected(socket.username);
		};
		socket.onmessage = (m) => {
			const data = JSON.parse(m.data);
			if (data.event === "send-message") {
				this.send(socket.username, m);
			}
			else if (data.event === "create-private-room") {
				this.createPrivateRoom(data);
				console.log("Create private room messages", JSON.stringify(data));
				this.broadcastUsernames();
			}
			else if (data.event === "join-room") {
				this.updateMemberInRooms(data);
				console.log("Update members in room messages", JSON.stringify(data));
			}
		};
		this.connectedClients.set(username, socket);

		console.log(`New client connected: ${username}`);
	}

	private send(username: string, message: any) {
		const data = JSON.parse(message.data);
		if (data.event !== "send-message") {
			return;
		}

		this.broadcast({
			event: "send-message",
			username: username,
			message: data.message,
		});
	}

	private clientDisconnected(username: string) {
		this.connectedClients.delete(username);
		const room = this.listRoom.get("Public Room");
		if (room) {
			room.roomMember = room.roomMember.filter((client) => client.username !== username);
		}
		this.broadcastUsernames();
		console.log(`Client ${username} disconnected and removed from the room.`);
	}

	private broadcastUsernames() {
		const roomsData = Array.from(this.listRoom.values()).map((room) => ({
			roomName: room.name,
			members: room.roomMember.map((client) => client.username),
		}));

		const data = {
			event: "update-users",
			rooms: roomsData,
		};

		this.broadcast(data);

		console.log("Sent username list:", JSON.stringify(data));
	}

	private broadcast(message: AppEvent) {
		const messageString = JSON.stringify(message);
		if (message.event === "update-users") {
			for (const client of this.connectedClients.values()) {
				client.send(messageString);
			}
			console.log("Updating users:", messageString);
		}
		else if (message.event === "send-message") {
			const userRoom = this.findRoomByUsername(message.username);

			if (userRoom) {
				for (const client of userRoom.roomMember) {
					client.send(messageString);
				}
			}
			console.log(`Broadcasting messages in ${userRoom?.name}:`, messageString);
		}
	}

	private findRoomByUsername(username: string): Room | undefined {
		for (const room of this.listRoom.values()) {
			if (room.roomMember.some((client) => client.username === username)) {
				return room;
			}
		}
		return undefined;
	}

	private createPrivateRoom(message: AppEvent) {
		if (this.listRoom.has(message.roomName)) {
			return;
		}
		const newRoom: Room = {
			name: message.roomName,
			isPublic: false,
			password: message.password,
			roomMember: [],
		};
		this.listRoom.set(message.roomName, newRoom);
	}

	updateMemberInRooms(message: AppEvent) {
		const newRoom = this.listRoom.get(message.roomName); // -> sudah di roomnya
		const oldRoom = this.findRoomByUsername(message.username);
		const socket = this.connectedClients.get(message.username);

		if (oldRoom && newRoom && socket && (newRoom.password === message.roomPassword || message.roomName === "Public Room")) {
			newRoom.roomMember.push(socket);
			oldRoom.roomMember = oldRoom.roomMember.filter((client) => client.username !== message.username);
			this.broadcastUsernames()
			socket.send(JSON.stringify({
				event: "clear-chat"
			}));
		}
		else {
			alert("Password Salah");
			return;
		}
	}
}