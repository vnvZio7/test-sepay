// // VideoCall.jsx
// import { useEffect, useRef, useState } from "react";
// import { io } from "socket.io-client";

// const socket = io("http://localhost:8080");

// // giả sử component này dùng cho BÁC SĨ
// // nếu sau này dùng chung cho cả bệnh nhân thì truyền prop isDoctor vào
// const IS_DOCTOR = true;

// export default function VideoCall() {
//   const localVideo = useRef(null);
//   const remoteVideo = useRef(null);
//   const peer = useRef(null);
//   const remoteUser = useRef(null);

//   const localStreamRef = useRef(null); // cam + mic bác sĩ
//   const screenStreamRef = useRef(null); // stream màn hình khi bác sĩ share
//   const videoSenderRef = useRef(null); // sender video trong RTCPeerConnection

//   // Recorder cho buổi tư vấn (bên bác sĩ)
//   const doctorRecorderRef = useRef(null);
//   const doctorRecordedChunksRef = useRef([]);

//   const [roomId, setRoomId] = useState("");
//   const [joined, setJoined] = useState(false);
//   const [remoteConnected, setRemoteConnected] = useState(false);

//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCamOn, setIsCamOn] = useState(true);
//   const [isScreenSharing, setIsScreenSharing] = useState(false);
//   const [isRecordingDoctor, setIsRecordingDoctor] = useState(false);

//   // trạng thái media của bên kia (bệnh nhân)
//   const [remoteMicOn, setRemoteMicOn] = useState(true);
//   const [remoteCamOn, setRemoteCamOn] = useState(true);

//   // ------------------------------ //
//   // Helper: tạo RTCPeerConnection  //
//   // ------------------------------ //
//   function createPeerConnection(stream) {
//     const pc = new RTCPeerConnection({
//       iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
//     });

//     // Add local tracks + lưu sender video
//     stream.getTracks().forEach((track) => {
//       const sender = pc.addTrack(track, stream);
//       if (track.kind === "video") {
//         videoSenderRef.current = sender;
//       }
//     });

//     // Nhận track remote (bệnh nhân)
//     pc.ontrack = (event) => {
//       if (remoteVideo.current) {
//         remoteVideo.current.srcObject = event.streams[0];
//       }
//       setRemoteConnected(true);
//     };

//     // ICE candidate
//     pc.onicecandidate = (event) => {
//       if (event.candidate && remoteUser.current) {
//         socket.emit("ice-candidate", {
//           to: remoteUser.current,
//           candidate: event.candidate,
//         });
//       }
//     };

//     pc.onconnectionstatechange = () => {
//       if (
//         pc.connectionState === "disconnected" ||
//         pc.connectionState === "failed" ||
//         pc.connectionState === "closed"
//       ) {
//         setRemoteConnected(false);
//       }
//     };

//     return pc;
//   }

//   // ------------------------------ //
//   // Start local stream + peer      //
//   // ------------------------------ //
//   async function ensurePeer() {
//     if (peer.current && localStreamRef.current) return peer.current;

//     const stream = await navigator.mediaDevices.getUserMedia({
//       video: true,
//       audio: true,
//     });

//     localStreamRef.current = stream;
//     if (localVideo.current) {
//       localVideo.current.srcObject = stream;
//     }

//     peer.current = createPeerConnection(stream);
//     return peer.current;
//   }

//   // ------------------------------ //
//   // Join Room                      //
//   // ------------------------------ //
//   async function joinRoom() {
//     if (!roomId.trim()) return;
//     await ensurePeer();
//     socket.emit("join-room", roomId);
//     setJoined(true);

//     socket.emit("media-state", {
//       roomId,
//       micOn: isMicOn,
//       camOn: isCamOn,
//     });
//   }

//   // ------------------------------ //
//   // Controls: Mic / Cam            //
//   // ------------------------------ //
//   function toggleMic() {
//     const stream = localStreamRef.current;
//     if (!stream) return;

//     const newState = !isMicOn;
//     stream.getAudioTracks().forEach((t) => (t.enabled = newState));
//     setIsMicOn(newState);

//     if (roomId) {
//       socket.emit("media-state", {
//         roomId,
//         micOn: newState,
//         camOn: isCamOn,
//       });
//     }
//   }

//   function toggleCam() {
//     const stream = localStreamRef.current;
//     if (!stream) return;

//     const newState = !isCamOn;
//     stream.getVideoTracks().forEach((t) => (t.enabled = newState));
//     setIsCamOn(newState);

//     if (roomId) {
//       socket.emit("media-state", {
//         roomId,
//         micOn: isMicOn,
//         camOn: newState,
//       });
//     }
//   }

//   // ------------------------------ //
//   // Screen share trong cuộc gọi    //
//   // ------------------------------ //
//   async function startScreenShare() {
//     if (isScreenSharing) return;

//     try {
//       const screenStream = await navigator.mediaDevices.getDisplayMedia({
//         video: { frameRate: 30 },
//         audio: false, // audio vẫn từ mic
//       });

//       const screenTrack = screenStream.getVideoTracks()[0];
//       if (!screenTrack) return;

//       screenStreamRef.current = screenStream;

//       // thay video track gửi cho người dùng bằng màn hình
//       if (videoSenderRef.current) {
//         await videoSenderRef.current.replaceTrack(screenTrack);
//       }

//       // local preview: bác sĩ thấy màn hình mình
//       if (localVideo.current) {
//         localVideo.current.srcObject = screenStream;
//       }

//       setIsScreenSharing(true);
//     } catch (err) {
//       console.error("Screen share error:", err);
//     }
//   }

//   async function stopScreenShare() {
//     if (!isScreenSharing) return;

//     const screenStream = screenStreamRef.current;
//     if (screenStream) {
//       screenStream.getTracks().forEach((t) => t.stop());
//       screenStreamRef.current = null;
//     }

//     // trả video gửi cho người dùng về camera
//     const camStream = localStreamRef.current;
//     if (camStream) {
//       const camTrack = camStream.getVideoTracks()[0];
//       if (camTrack && videoSenderRef.current) {
//         await videoSenderRef.current.replaceTrack(camTrack);
//       }
//       if (localVideo.current) {
//         localVideo.current.srcObject = camStream;
//       }
//     }

//     setIsScreenSharing(false);
//   }

//   // ------------------------------ //
//   // Ghi lại buổi tư vấn (bên bác sĩ) //
//   // Ghi: video của bác sĩ (cam hoặc screen share) + audio 2 bên //
//   // ------------------------------ //
//   async function startDoctorRecording() {
//     if (!IS_DOCTOR) return;
//     if (isRecordingDoctor || doctorRecorderRef.current) return;

//     const camStream = localStreamRef.current; // cam + mic bác sĩ
//     const shareStream = screenStreamRef.current; // màn hình nếu đang share
//     const remoteStream = remoteVideo.current?.srcObject; // stream bệnh nhân

//     if (!camStream && !shareStream) {
//       console.warn(
//         "Chưa có video của bác sĩ (cam hoặc share màn hình) để ghi."
//       );
//       return;
//     }

//     const mixedStream = new MediaStream();

//     // VIDEO: ưu tiên màn hình share, không thì dùng cam
//     let videoTrack = null;
//     if (shareStream && shareStream.getVideoTracks().length) {
//       videoTrack = shareStream.getVideoTracks()[0].clone();
//     } else if (camStream && camStream.getVideoTracks().length) {
//       videoTrack = camStream.getVideoTracks()[0].clone();
//     }

//     if (videoTrack) {
//       mixedStream.addTrack(videoTrack);
//     }

//     // AUDIO: bác sĩ
//     if (camStream) {
//       camStream
//         .getAudioTracks()
//         .forEach((t) => mixedStream.addTrack(t.clone()));
//     }

//     // AUDIO: bệnh nhân
//     if (remoteStream) {
//       remoteStream
//         .getAudioTracks()
//         .forEach((t) => mixedStream.addTrack(t.clone()));
//     }

//     // nếu vẫn không có audio/video nào thì thôi
//     if (!mixedStream.getTracks().length) {
//       console.warn("Không có track nào để ghi (audio/video).");
//       return;
//     }

//     doctorRecordedChunksRef.current = [];

//     try {
//       const rec = new MediaRecorder(mixedStream, {
//         mimeType: "video/webm;codecs=vp9,opus",
//       });
//       doctorRecorderRef.current = rec;

//       rec.ondataavailable = (e) => {
//         if (e.data.size > 0) {
//           doctorRecordedChunksRef.current.push(e.data);
//         }
//       };

//       rec.onstop = () => {
//         // dừng các track CLONE, không ảnh hưởng tới call
//         mixedStream.getTracks().forEach((t) => t.stop());

//         const blob = new Blob(doctorRecordedChunksRef.current, {
//           type: "video/webm",
//         });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = `session-doctor-${Date.now()}.webm`;
//         document.body.appendChild(a);
//         a.click();
//         a.remove();
//         URL.revokeObjectURL(url);

//         doctorRecorderRef.current = null;
//         doctorRecordedChunksRef.current = [];
//         setIsRecordingDoctor(false);
//       };

//       rec.start();
//       setIsRecordingDoctor(true);
//       console.log("Bắt đầu ghi lại buổi tư vấn (bên bác sĩ)");
//     } catch (err) {
//       console.error("Doctor recording error:", err);
//     }
//   }

//   function stopDoctorRecording() {
//     const r = doctorRecorderRef.current;
//     if (r && r.state !== "inactive") {
//       r.stop(); // onstop sẽ lo phần còn lại
//     }
//   }

//   // ------------------------------ //
//   // Cleanup khi rời cuộc gọi       //
//   // ------------------------------ //
//   function cleanupCall() {
//     const pc = peer.current;

//     if (pc) {
//       try {
//         pc.getSenders().forEach((s) => s.track && s.track.stop());
//         pc.close();
//       } catch (e) {
//         console.error(e);
//       }
//       peer.current = null;
//     }

//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((t) => t.stop());
//       localStreamRef.current = null;
//     }

//     if (localVideo.current) localVideo.current.srcObject = null;
//     if (remoteVideo.current) remoteVideo.current.srcObject = null;

//     // dừng recorder nếu còn
//     const dr = doctorRecorderRef.current;
//     if (dr && dr.state && dr.state !== "inactive") {
//       try {
//         dr.stop();
//       } catch (e) {
//         console.error(e);
//       }
//     }
//     doctorRecorderRef.current = null;
//     doctorRecordedChunksRef.current = [];

//     // tắt share màn hình nếu còn
//     if (screenStreamRef.current) {
//       screenStreamRef.current.getTracks().forEach((t) => t.stop());
//       screenStreamRef.current = null;
//     }

//     setIsRecordingDoctor(false);
//     setIsScreenSharing(false);
//     setJoined(false);
//     setRemoteConnected(false);
//     setRemoteMicOn(true);
//     setRemoteCamOn(true);
//   }

//   // ------------------------------ //
//   // Leave Call (ra khỏi phòng)     //
//   // ------------------------------ //
//   function leaveCall() {
//     if (roomId) {
//       socket.emit("leave-room", { roomId });
//     }
//     cleanupCall();
//   }

//   // ------------------------------ //
//   // Socket Signaling               //
//   // ------------------------------ //
//   useEffect(() => {
//     const handleUserJoined = async (id) => {
//       remoteUser.current = id;
//       const pc = await ensurePeer();

//       if (pc.signalingState !== "stable") {
//         console.warn(
//           "Skip creating offer, signalingState =",
//           pc.signalingState
//         );
//         return;
//       }

//       const offer = await pc.createOffer();
//       await pc.setLocalDescription(offer);
//       socket.emit("offer", { to: id, offer: pc.localDescription });

//       if (roomId) {
//         socket.emit("media-state", {
//           roomId,
//           micOn: isMicOn,
//           camOn: isCamOn,
//         });
//       }
//     };

//     const handleOffer = async ({ from, offer }) => {
//       remoteUser.current = from;
//       const pc = await ensurePeer();

//       if (pc.signalingState !== "stable") {
//         console.warn(
//           "Skip handling offer, signalingState =",
//           pc.signalingState
//         );
//         return;
//       }

//       await pc.setRemoteDescription(offer);
//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);
//       socket.emit("answer", { to: from, answer: pc.localDescription });
//     };

//     const handleAnswer = async ({ answer }) => {
//       const pc = peer.current;
//       if (!pc) return;

//       if (pc.signalingState !== "have-local-offer") {
//         console.warn(
//           "Skip setting answer, signalingState =",
//           pc.signalingState
//         );
//         return;
//       }

//       await pc.setRemoteDescription(answer);
//     };

//     const handleIceCandidate = async ({ candidate }) => {
//       try {
//         const pc = peer.current;
//         if (!pc || !candidate) return;
//         await pc.addIceCandidate(candidate);
//       } catch (error) {
//         console.error("ICE error:", error);
//       }
//     };

//     const handlePeerMediaState = ({ micOn, camOn }) => {
//       setRemoteMicOn(micOn);
//       setRemoteCamOn(camOn);
//     };

//     const handlePeerLeft = () => {
//       setRemoteConnected(false);
//       if (remoteVideo.current) remoteVideo.current.srcObject = null;
//       setRemoteMicOn(true);
//       setRemoteCamOn(true);
//     };

//     socket.on("user-joined", handleUserJoined);
//     socket.on("offer", handleOffer);
//     socket.on("answer", handleAnswer);
//     socket.on("ice-candidate", handleIceCandidate);
//     socket.on("peer-media-state", handlePeerMediaState);
//     socket.on("peer-left", handlePeerLeft);

//     return () => {
//       socket.off("user-joined", handleUserJoined);
//       socket.off("offer", handleOffer);
//       socket.off("answer", handleAnswer);
//       socket.off("ice-candidate", handleIceCandidate);
//       socket.off("peer-media-state", handlePeerMediaState);
//       socket.off("peer-left", handlePeerLeft);
//     };
//   }, [roomId, isMicOn, isCamOn]);

//   // ------------------------------ //
//   // UI                             //
//   // ------------------------------ //
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-6 text-slate-50">
//       <div className="w-full max-w-5xl rounded-[32px] bg-slate-900/90 border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl p-4 md:p-6">
//         {/* Top bar */}
//         <div className="flex items-center justify-between gap-3 mb-4">
//           <div className="flex items-center gap-3">
//             <div className="h-10 w-10 rounded-full bg-sky-500 flex items-center justify-center text-sm font-semibold">
//               VC
//             </div>
//             <div>
//               <div className="text-sm font-semibold">
//                 Video room {roomId || "#"}
//               </div>
//               <div className="text-[11px] text-slate-400">
//                 {remoteConnected
//                   ? "Đang trong cuộc gọi"
//                   : joined
//                   ? "Đang chờ người kia tham gia..."
//                   : "Nhập Room ID để bắt đầu"}
//               </div>
//             </div>
//           </div>

//           {!joined && (
//             <div className="flex items-center gap-2">
//               <input
//                 className="hidden sm:block rounded-full border border-slate-700 bg-slate-900/80 px-4 py-1.5 text-xs outline-none focus:ring-2 focus:ring-sky-500/70"
//                 placeholder="Room ID (vd: 123456)"
//                 value={roomId}
//                 onChange={(e) => setRoomId(e.target.value)}
//               />
//               <button
//                 onClick={joinRoom}
//                 className="inline-flex items-center gap-2 rounded-full bg-sky-500 hover:bg-sky-400 px-4 py-1.5 text-xs font-semibold shadow-lg shadow-sky-500/30 transition"
//               >
//                 Tham gia
//               </button>
//             </div>
//           )}
//         </div>

//         {!joined && (
//           <div className="sm:hidden mb-4">
//             <input
//               className="w-full rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-sky-500/70"
//               placeholder="Room ID (vd: 123456)"
//               value={roomId}
//               onChange={(e) => setRoomId(e.target.value)}
//             />
//           </div>
//         )}

//         {/* Stage: remote full, local nhỏ */}
//         <div className="relative rounded-[28px] overflow-hidden bg-black/90 aspect-video border border-slate-800">
//           {/* Remote video (bệnh nhân) */}
//           <video
//             ref={remoteVideo}
//             autoPlay
//             playsInline
//             className={`h-full w-full object-cover transition-opacity duration-200 ${
//               remoteCamOn ? "opacity-100" : "opacity-0"
//             }`}
//           />

//           {/* Overlay khi chưa có remote */}
//           {!remoteConnected && (
//             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
//               <div className="text-sm mb-1">
//                 {joined
//                   ? "Người còn lại chưa ở trong cuộc gọi."
//                   : "Chưa tham gia phòng."}
//               </div>
//               <div className="text-[11px] text-slate-400">
//                 Khi kết nối thành công, video của họ sẽ xuất hiện ở đây.
//               </div>
//             </div>
//           )}

//           {/* Avatar remote khi tắt cam */}
//           {remoteConnected && !remoteCamOn && (
//             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
//               <div className="h-20 w-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-semibold">
//                 R
//               </div>
//             </div>
//           )}

//           {/* Icon mic remote */}
//           {remoteConnected && (
//             <div className="absolute bottom-3 left-3 h-8 w-8 rounded-full bg-black/70 border border-slate-700 flex items-center justify-center text-lg">
//               {remoteMicOn ? "🎙️" : "🔇"}
//             </div>
//           )}

//           {/* Local video (bác sĩ) nhỏ ở góc */}
//           <div className="absolute bottom-4 right-4 w-32 sm:w-40 h-24 sm:h-28 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg shadow-black/60 bg-black/80">
//             <video
//               ref={localVideo}
//               autoPlay
//               playsInline
//               muted
//               className={`h-full w-full object-cover transition-opacity duration-200 ${
//                 isCamOn || isScreenSharing ? "opacity-100" : "opacity-0"
//               }`}
//             />
//             {!isCamOn && !isScreenSharing && (
//               <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
//                 <div className="h-12 w-12 rounded-full bg-slate-600 flex items-center justify-center text-lg font-semibold">
//                   D
//                 </div>
//               </div>
//             )}
//             {/* Icon mic local */}
//             <div className="absolute top-2 left-2 h-7 w-7 rounded-full bg-black/70 border border-slate-600 flex items-center justify-center text-base">
//               {isMicOn ? "🎙️" : "🔇"}
//             </div>
//           </div>

//           {/* Info góc trên trái */}
//           {joined && (
//             <div className="absolute top-3 left-3 text-[11px] px-3 py-1.5 rounded-full bg-black/60 border border-slate-700/80 flex items-center gap-2">
//               <span
//                 className={`h-2 w-2 rounded-full ${
//                   remoteConnected ? "bg-emerald-400" : "bg-amber-400"
//                 }`}
//               />
//               <span>
//                 {remoteConnected ? "Đã kết nối" : "Đang chờ kết nối..."}
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Bottom controls */}
//         {joined && (
//           <div className="mt-4 flex justify-center">
//             <div className="inline-flex items-center gap-3 rounded-full bg-black/60 border border-slate-800 px-4 py-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.7)]">
//               {/* Mic */}
//               <button
//                 onClick={toggleMic}
//                 className={`h-11 w-11 rounded-full flex items-center justify-center text-xl transition ${
//                   isMicOn
//                     ? "bg-slate-700 hover:bg-slate-600"
//                     : "bg-red-600 hover:bg-red-500"
//                 }`}
//                 title={isMicOn ? "Tắt micro" : "Bật micro"}
//               >
//                 {isMicOn ? "🎙️" : "🔇"}
//               </button>

//               {/* Cam */}
//               <button
//                 onClick={toggleCam}
//                 className={`h-11 w-11 rounded-full flex items-center justify-center text-xl transition ${
//                   isCamOn && !isScreenSharing
//                     ? "bg-slate-700 hover:bg-slate-600"
//                     : "bg-amber-500 hover:bg-amber-400"
//                 }`}
//                 title={isCamOn ? "Tắt camera" : "Bật camera"}
//                 disabled={isScreenSharing}
//               >
//                 {isCamOn ? "📹" : "📷"}
//               </button>

//               {/* Share Screen */}
//               <button
//                 onClick={isScreenSharing ? stopScreenShare : startScreenShare}
//                 className={`h-11 w-11 rounded-full flex items-center justify-center text-xl transition ${
//                   isScreenSharing
//                     ? "bg-purple-600 hover:bg-purple-500"
//                     : "bg-slate-700 hover:bg-slate-600"
//                 }`}
//                 title={
//                   isScreenSharing ? "Dừng share màn hình" : "Share màn hình"
//                 }
//               >
//                 {isScreenSharing ? "🛑" : "🖥"}
//               </button>

//               {/* Record Doctor (chỉ bên bác sĩ có nút này) */}
//               {IS_DOCTOR && (
//                 <button
//                   onClick={
//                     isRecordingDoctor
//                       ? stopDoctorRecording
//                       : startDoctorRecording
//                   }
//                   className={`h-11 w-11 rounded-full flex items-center justify-center text-xl transition ${
//                     isRecordingDoctor
//                       ? "bg-rose-600 hover:bg-rose-500"
//                       : "bg-slate-700 hover:bg-slate-600"
//                   }`}
//                   title={
//                     isRecordingDoctor
//                       ? "Dừng ghi buổi tư vấn"
//                       : "Ghi lại buổi tư vấn (cam/màn hình + audio 2 bên)"
//                   }
//                 >
//                   {isRecordingDoctor ? "⏹️" : "🎥"}
//                 </button>
//               )}

//               {/* Leave */}
//               <button
//                 onClick={leaveCall}
//                 className="h-11 w-11 rounded-full flex items-center justify-center text-xl bg-red-600 hover:bg-red-500 transition"
//                 title="Rời cuộc gọi (ra khỏi phòng)"
//               >
//                 📞
//               </button>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import VideoCallPopup from "./VideoCallPopup";

export default function VideoCall() {
  const [openCall, setOpenCall] = useState(false);

  return (
    <>
      <button
        className="border-2 border-red-700 m-10 p-2 rounded"
        onClick={() => setOpenCall(true)}
      >
        Gọi video
      </button>

      <VideoCallPopup
        roomId="123456"
        open={openCall}
        onClose={() => setOpenCall(false)}
      />
    </>
  );
}
