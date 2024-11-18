const io = require("socket.io-client");

const socket = io("http://localhost:81/chatroom"); // Socket.IO 네임스페이스 연결

socket.on("connect", () => {
    console.log("Connected to server");

    // 방 입장
    socket.emit("enter", ["John2", "room1"]);
    // 메시지 보내기
    socket.emit("send", ["room1", "John2", "Hello everyone!"]);

    // 서버에서 수신한 메시지 출력
    socket.on("message", (data) => {
        console.log(`Message from ${data.nickname}: ${data.message}`);
    });

    // 방의 유저 리스트 요청
    setTimeout(() => {
        socket.emit("getUserList", "room1");
    }, 1000);

    // 방 사용자 목록 수신
    socket.on("userListroom1", (userList) => {
        console.log("User List:", userList);
    });

    // 방 나가기
    setTimeout(() => {
        socket.emit("leave", ["John2", "room1"]);
        socket.close();
    }, 3000);

    // 에러 메시지 처리
    socket.on('error', (data) => {
        console.error(`Error: ${data.message}`);
    });

});
