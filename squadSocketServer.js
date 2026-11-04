const crypto = require('crypto');

// RFC 6455 WebSocket Magic GUID
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// In-memory Squad Rooms store
// Map<roomId, SquadRoom>
const rooms = new Map();

// Helper to create or get default rooms
function initDefaultRooms() {
  if (rooms.size === 0) {
    createRoom('room-push-beasts', 'Heavy Push Syndicate 🔥', 'Chest & Triceps', 'Build massive pressing power with synchronized rest cadence.');
    createRoom('room-leg-day-cult', 'Leg Day Survivors 💀', 'Quads & Hamstrings', 'Nobody skips squats. Group rest timers and pacing.');
    createRoom('room-hypertrophy-lab', 'Hypertrophy Lab 🧬', 'Full Body / Upper', 'Strict 90s rest windows for maximum metabolic stress.');
  }
}

function createRoom(id, name, split, description) {
  const room = {
    id: id || `room-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name || 'Squad Workout Room',
    split: split || 'General Strength',
    description: description || 'Synchronized rest timers and hype feed.',
    createdAt: Date.now(),
    timer: {
      active: false,
      secondsLeft: 0,
      totalSeconds: 90,
      startedBy: null,
      startedAt: null,
      intervalId: null
    },
    members: new Map(), // socket -> member info
    activities: [
      {
        id: `act-${Date.now()}`,
        sender: 'System',
        text: 'Room opened. Connect and lift together!',
        type: 'SYSTEM',
        timestamp: Date.now()
      }
    ]
  };
  rooms.set(room.id, room);
  return room;
}

function formatRoomInfo(room) {
  const membersList = [];
  for (const [, m] of room.members.entries()) {
    membersList.push({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      currentExercise: m.currentExercise,
      status: m.status, // "LIFTING" | "RESTING" | "HYDRATING" | "IDLE"
      lastSet: m.lastSet,
      weightUnit: m.weightUnit || 'kg'
    });
  }

  return {
    id: room.id,
    name: room.name,
    split: room.split,
    description: room.description,
    memberCount: membersList.length,
    members: membersList,
    timer: {
      active: room.timer.active,
      secondsLeft: room.timer.secondsLeft,
      totalSeconds: room.timer.totalSeconds,
      startedBy: room.timer.startedBy
    },
    activities: room.activities.slice(-25)
  };
}

// Low-level RFC 6455 frame builder for server-to-client (unmasked)
function sendWsText(socket, text) {
  if (socket.destroyed || !socket.writable) return;
  try {
    const payload = Buffer.from(text, 'utf8');
    const length = payload.length;
    let header;

    if (length <= 125) {
      header = Buffer.alloc(2);
      header[0] = 0x81; // FIN + text opcode (0x1)
      header[1] = length; // Mask bit = 0
    } else if (length <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }

    socket.write(Buffer.concat([header, payload]));
  } catch (err) {
    console.error('Error writing WS frame:', err.message);
  }
}

function broadcastToRoom(room, messageObj) {
  const jsonStr = JSON.stringify(messageObj);
  for (const [sock] of room.members.entries()) {
    sendWsText(sock, jsonStr);
  }
}

function startRoomTimer(room, seconds, startedByName) {
  if (room.timer.intervalId) {
    clearInterval(room.timer.intervalId);
    room.timer.intervalId = null;
  }

  room.timer.active = true;
  room.timer.secondsLeft = seconds;
  room.timer.totalSeconds = seconds;
  room.timer.startedBy = startedByName || 'Lifter';
  room.timer.startedAt = Date.now();

  broadcastToRoom(room, {
    type: 'TIMER_STATE',
    timer: {
      active: true,
      secondsLeft: room.timer.secondsLeft,
      totalSeconds: room.timer.totalSeconds,
      startedBy: room.timer.startedBy
    }
  });

  room.activities.push({
    id: `act-${Date.now()}`,
    sender: startedByName || 'Squad',
    text: `Started ${seconds}s rest timer for the squad! ⏱️`,
    type: 'TIMER',
    timestamp: Date.now()
  });

  room.timer.intervalId = setInterval(() => {
    room.timer.secondsLeft -= 1;
    if (room.timer.secondsLeft <= 0) {
      room.timer.secondsLeft = 0;
      room.timer.active = false;
      clearInterval(room.timer.intervalId);
      room.timer.intervalId = null;

      broadcastToRoom(room, {
        type: 'TIMER_EXPIRED',
        timer: {
          active: false,
          secondsLeft: 0,
          totalSeconds: room.timer.totalSeconds,
          startedBy: room.timer.startedBy
        }
      });

      room.activities.push({
        id: `act-${Date.now()}`,
        sender: 'Timer',
        text: 'Rest interval complete! Time to crush the next set! 💪⚡',
        type: 'TIMER',
        timestamp: Date.now()
      });
      broadcastToRoom(room, {
        type: 'ACTIVITY_LOG',
        activity: room.activities[room.activities.length - 1]
      });
    } else {
      broadcastToRoom(room, {
        type: 'TIMER_TICK',
        secondsLeft: room.timer.secondsLeft
      });
    }
  }, 1000);
}

function adjustRoomTimer(room, deltaSeconds) {
  if (!room.timer.active) return;
  room.timer.secondsLeft = Math.max(0, room.timer.secondsLeft + deltaSeconds);
  room.timer.totalSeconds = Math.max(room.timer.totalSeconds, room.timer.secondsLeft);

  broadcastToRoom(room, {
    type: 'TIMER_STATE',
    timer: {
      active: room.timer.active,
      secondsLeft: room.timer.secondsLeft,
      totalSeconds: room.timer.totalSeconds,
      startedBy: room.timer.startedBy
    }
  });
}

function stopRoomTimer(room, stoppedByName) {
  if (room.timer.intervalId) {
    clearInterval(room.timer.intervalId);
    room.timer.intervalId = null;
  }
  room.timer.active = false;
  room.timer.secondsLeft = 0;

  broadcastToRoom(room, {
    type: 'TIMER_STATE',
    timer: {
      active: false,
      secondsLeft: 0,
      totalSeconds: room.timer.totalSeconds,
      startedBy: stoppedByName || 'Lifter'
    }
  });

  room.activities.push({
    id: `act-${Date.now()}`,
    sender: stoppedByName || 'Squad',
    text: 'Rest timer skipped. Ready for action! ⚡',
    type: 'TIMER',
    timestamp: Date.now()
  });
  broadcastToRoom(room, {
    type: 'ACTIVITY_LOG',
    activity: room.activities[room.activities.length - 1]
  });
}

function handleWsMessage(socket, room, member, data) {
  try {
    const msg = JSON.parse(data);
    switch (msg.type) {
      case 'UPDATE_STATUS': {
        // e.g. status: "LIFTING" | "RESTING" | "HYDRATING"
        // exercise: "Bench Press 90kg"
        member.status = msg.status || member.status;
        if (msg.exercise) member.currentExercise = msg.exercise;
        broadcastToRoom(room, {
          type: 'MEMBER_UPDATED',
          member: {
            id: member.id,
            name: member.name,
            avatar: member.avatar,
            currentExercise: member.currentExercise,
            status: member.status,
            lastSet: member.lastSet
          }
        });
        break;
      }

      case 'LOG_SET': {
        // exercise: "Incline DB Press", reps: 10, weight: 32, unit: "kg"
        member.lastSet = {
          exercise: msg.exercise || member.currentExercise || 'Exercise',
          weight: msg.weight || 0,
          reps: msg.reps || 0,
          unit: msg.unit || 'kg',
          timestamp: Date.now()
        };
        member.status = 'RESTING';

        const act = {
          id: `act-${Date.now()}`,
          sender: member.name,
          text: `completed ${member.lastSet.exercise} · ${member.lastSet.weight}${member.lastSet.unit} × ${member.lastSet.reps} reps 🔥`,
          type: 'SET_LOGGED',
          timestamp: Date.now()
        };
        room.activities.push(act);

        // Auto trigger rest timer if requested
        if (msg.autoRestSeconds && msg.autoRestSeconds > 0) {
          startRoomTimer(room, msg.autoRestSeconds, member.name);
        }

        broadcastToRoom(room, {
          type: 'MEMBER_UPDATED',
          member: {
            id: member.id,
            name: member.name,
            avatar: member.avatar,
            currentExercise: member.currentExercise,
            status: member.status,
            lastSet: member.lastSet
          }
        });
        broadcastToRoom(room, {
          type: 'ACTIVITY_LOG',
          activity: act
        });
        break;
      }

      case 'START_TIMER': {
        const secs = parseInt(msg.seconds, 10) || 90;
        startRoomTimer(room, secs, member.name);
        break;
      }

      case 'ADJUST_TIMER': {
        const delta = parseInt(msg.delta, 10) || 15;
        adjustRoomTimer(room, delta);
        break;
      }

      case 'STOP_TIMER': {
        stopRoomTimer(room, member.name);
        break;
      }

      case 'HYPE_REACTION': {
        // emoji: "🔥" | "💪" | "⚡" | "👏" | "🦾"
        const reaction = {
          id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          senderId: member.id,
          senderName: member.name,
          emoji: msg.emoji || '🔥',
          timestamp: Date.now()
        };
        broadcastToRoom(room, {
          type: 'HYPE_REACTION',
          reaction
        });
        break;
      }

      case 'CHAT_MESSAGE': {
        const text = (msg.text || '').trim();
        if (!text) return;
        const act = {
          id: `act-${Date.now()}`,
          sender: member.name,
          text: text,
          type: 'CHAT',
          timestamp: Date.now()
        };
        room.activities.push(act);
        broadcastToRoom(room, {
          type: 'ACTIVITY_LOG',
          activity: act
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Squad message parse error:', err.message);
  }
}

// Attach RFC 6455 handler to Node HTTP server
function attachSquadSocketServer(server) {
  initDefaultRooms();

  server.on('upgrade', (req, socket) => {
    // Check URL path: expects /squad-ws?roomId=xyz&name=Alex
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:8000'}`);
    if (parsedUrl.pathname !== '/squad-ws') {
      return; // let other upgrade handlers proceed or ignore
    }

    const secWsKey = req.headers['sec-websocket-key'];
    if (!secWsKey) {
      socket.destroy();
      return;
    }

    // Complete standard RFC 6455 handshake
    const acceptSha1 = crypto
      .createHash('sha1')
      .update(secWsKey + WS_GUID)
      .digest('base64');

    const headers = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptSha1}`
    ];

    socket.write(headers.concat('\r\n').join('\r\n'));

    // Extract query parameters
    const roomId = parsedUrl.searchParams.get('roomId') || 'room-push-beasts';
    let room = rooms.get(roomId);
    if (!room) {
      room = createRoom(roomId, 'Custom Squad Room', 'Custom Split', 'User generated squad room.');
    }

    const memberName = parsedUrl.searchParams.get('name') || `Lifter_${Math.floor(100 + Math.random() * 900)}`;
    const avatar = parsedUrl.searchParams.get('avatar') || '⚡';
    const memberId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const member = {
      id: memberId,
      name: memberName,
      avatar: avatar,
      currentExercise: 'Bench Press',
      status: 'LIFTING',
      lastSet: null,
      joinedAt: Date.now()
    };

    room.members.set(socket, member);

    // Announce join
    const joinAct = {
      id: `act-${Date.now()}`,
      sender: 'Squad',
      text: `${member.name} entered the room! 💥`,
      type: 'JOIN',
      timestamp: Date.now()
    };
    room.activities.push(joinAct);

    // Send immediate initial state to newly connected client
    sendWsText(
      socket,
      JSON.stringify({
        type: 'ROOM_SYNC',
        room: formatRoomInfo(room),
        yourMemberId: member.id
      })
    );

    // Broadcast updated member roster to room
    broadcastToRoom(room, {
      type: 'MEMBER_JOINED',
      member: {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        currentExercise: member.currentExercise,
        status: member.status,
        lastSet: member.lastSet
      },
      activity: joinAct
    });

    // Frame accumulation buffer
    let buffer = Buffer.alloc(0);

    socket.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk]);

      while (buffer.length >= 2) {
        const byte1 = buffer[0];
        const byte2 = buffer[1];
        const opcode = byte1 & 0x0f;
        const isMasked = (byte2 & 0x80) !== 0;
        let payloadLen = byte2 & 0x7f;
        let offset = 2;

        if (payloadLen === 126) {
          if (buffer.length < offset + 2) break;
          payloadLen = buffer.readUInt16BE(offset);
          offset += 2;
        } else if (payloadLen === 127) {
          if (buffer.length < offset + 8) break;
          payloadLen = Number(buffer.readBigUInt64BE(offset));
          offset += 8;
        }

        let maskKey = null;
        if (isMasked) {
          if (buffer.length < offset + 4) break;
          maskKey = buffer.subarray(offset, offset + 4);
          offset += 4;
        }

        if (buffer.length < offset + payloadLen) {
          // Incomplete frame, wait for more data
          break;
        }

        const rawPayload = buffer.subarray(offset, offset + payloadLen);
        let unmasked = Buffer.alloc(payloadLen);

        if (isMasked && maskKey) {
          for (let i = 0; i < payloadLen; i++) {
            unmasked[i] = rawPayload[i] ^ maskKey[i % 4];
          }
        } else {
          unmasked = rawPayload;
        }

        // Advance buffer past this parsed frame
        buffer = buffer.subarray(offset + payloadLen);

        // Handle frame opcodes
        if (opcode === 0x8) {
          // Close frame
          socket.end();
          return;
        } else if (opcode === 0x9) {
          // Ping -> reply with Pong (0xA)
          const pong = Buffer.alloc(2);
          pong[0] = 0x8a;
          pong[1] = 0x00;
          socket.write(pong);
        } else if (opcode === 0x1) {
          // Text message
          const text = unmasked.toString('utf8');
          handleWsMessage(socket, room, member, text);
        }
      }
    });

    function cleanUp() {
      if (room.members.has(socket)) {
        room.members.delete(socket);
        const leaveAct = {
          id: `act-${Date.now()}`,
          sender: 'Squad',
          text: `${member.name} left the room.`,
          type: 'LEAVE',
          timestamp: Date.now()
        };
        room.activities.push(leaveAct);
        broadcastToRoom(room, {
          type: 'MEMBER_LEFT',
          memberId: member.id,
          activity: leaveAct
        });
      }
    }

    socket.on('close', cleanUp);
    socket.on('error', cleanUp);
  });
}

// REST helper to return active rooms list
function getRoomsList() {
  initDefaultRooms();
  const list = [];
  for (const [, room] of rooms.entries()) {
    list.push(formatRoomInfo(room));
  }
  return list;
}

module.exports = {
  attachSquadSocketServer,
  getRoomsList,
  createRoom
};

