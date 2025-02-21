import { useEffect, useRef, useState } from "react";
import logo from "/assets/openai-logomark.svg";
import LearningAssessment from "./LearningAssessment";
import EventLog from "./EventLog";
import ResponsePanel from "./ResponsePanel";

export default function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState([]);
  const [dataChannel, setDataChannel] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastUtterance, setLastUtterance] = useState('');
  const peerConnection = useRef(null);
  const audioElement = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  async function startSession() {
    try {
      const tokenResponse = await fetch("/token");
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      const pc = new RTCPeerConnection();

      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => (audioElement.current.srcObject = e.streams[0]);

      // Set up audio stream with specific constraints
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });
      pc.addTrack(ms.getTracks()[0]);

      // Initialize MediaRecorder
      mediaRecorder.current = new MediaRecorder(ms, {
        mimeType: 'audio/webm',
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0 && isRecording) {
          // Convert blob to array buffer
          event.data.arrayBuffer().then(buffer => {
            if (dataChannel?.readyState === 'open') {
              sendClientEvent({
                type: 'input_audio_buffer.append',
                audio_buffer: Array.from(new Int16Array(buffer))
              });
            }
          });
        }
      };

      const dc = pc.createDataChannel("oai-events");
      setDataChannel(dc);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      peerConnection.current = pc;
      
      // Send initial context to the model
      const context = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "system",
          content: [
            {
              type: "text",
              text: `You are a high school math teacher conducting a verbal assessment. You have access to these key mathematical concepts:

                    Algebra:
                    - Quadratic equations can be solved using the formula: x = (-b ± √(b² - 4ac)) / 2a
                    - Linear equations are in the form y = mx + b, where m is slope and b is y-intercept
                    - The slope (m) between two points is calculated as: (y₂ - y₁) / (x₂ - x₁)
                    - Exponent rules: aⁿ × aᵐ = aⁿ⁺ᵐ, (aⁿ)ᵐ = aⁿᵐ, a⁰ = 1

                    Geometry:
                    - Area of a circle is πr², where r is the radius
                    - The Pythagorean theorem states that a² + b² = c² in a right triangle
                    - The sum of interior angles in a triangle is 180 degrees
                    - Area of a rectangle is length × width, area of a triangle is ½ × base × height

                    Trigonometry:
                    - Basic trigonometric ratios in a right triangle:
                      * sin(θ) = opposite / hypotenuse
                      * cos(θ) = adjacent / hypotenuse
                      * tan(θ) = opposite / adjacent
                    - The unit circle helps define trigonometric functions for all angles
                    
                    Engage in a natural conversation. Ask questions one at a time about these topics, 
                    listen to responses, provide encouraging feedback, and correct any misconceptions. 
                    Keep the tone friendly and educational. Ask questions that test understanding rather 
                    than just memorization. Start by introducing yourself and explaining what you'll be doing.
                    
                    When evaluating responses, provide a score out of 100 and specific feedback about what 
                    was correct and what could be improved. Help students understand the underlying concepts 
                    when they make mistakes.`
            },
          ],
        },
      };
      
      if (dataChannel) {
        dataChannel.send(JSON.stringify(context));
      }
    } catch (error) {
      console.error("Session start error:", error);
    }
  }

  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }

    peerConnection.current.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    if (peerConnection.current) {
      peerConnection.current.close();
    }

    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
    setTranscript('');
  }

  function sendClientEvent(message) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error("Failed to send message - no data channel available", message);
    }
  }

  function speak(text) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      },
    };

    sendClientEvent(event);
  }

  function startRecording() {
    setIsRecording(true);
    setTranscript('');
    audioChunks.current = [];
    if (mediaRecorder.current && mediaRecorder.current.state === 'inactive') {
      mediaRecorder.current.start(100); // Send data every 100ms
    }
  }

  function stopRecording() {
    setIsRecording(false);
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
    }
    // Commit the audio buffer and request a response
    sendClientEvent({ type: "input_audio_buffer.commit" });
    
    // Send the transcript as user input to continue the conversation
    if (transcript) {
      const event = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "text",
              text: transcript,
            },
          ],
        },
      };
      sendClientEvent(event);
      sendClientEvent({ type: "response.create" });
    }
  }

  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        setEvents((prev) => [event, ...prev]);

        // Handle transcription events
        if (event.type === "conversation.item.create" && 
            event.item?.role === "user" && 
            event.item?.content?.[0]?.type === "text") {
          setTranscript(event.item.content[0].text);
        }

        // Handle when AI finishes speaking
        if (event.type === "conversation.item.create" && 
            event.item?.role === "assistant" && 
            event.item?.content?.[0]?.type === "text") {
          setLastUtterance(event.item.content[0].text);
          // Automatically start listening after the AI finishes speaking
          startRecording();
        }
      });

      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <img className="h-8 w-8" src={logo} alt="OpenAI logo" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">Voice Learning Assessment</h1>
            </div>
            <div>
              <button
                onClick={isSessionActive ? stopSession : startSession}
                className={`px-4 py-2 rounded-md ${
                  isSessionActive
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isSessionActive ? "End Session" : "Start Session"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex h-[calc(100vh-4rem)]">
        {/* Left side: Learning Assessment */}
        <div className="flex-1 p-6 overflow-y-auto">
          <LearningAssessment
            isConnected={isSessionActive}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            isRecording={isRecording}
            transcript={transcript}
            lastUtterance={lastUtterance}
            speak={speak}
          />
        </div>

        {/* Middle: Response Assessment */}
        <div className="w-[350px] border-l border-gray-200 bg-white p-4 overflow-y-auto">
          <ResponsePanel events={events} sendClientEvent={sendClientEvent} />
        </div>

        {/* Right side: Debug Event Log */}
        <div className="w-[350px] border-l border-gray-200 bg-white p-4 overflow-y-auto">
          <div className="sticky top-0 bg-white pb-2 mb-2 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Event Log</h2>
          </div>
          <EventLog events={events} />
        </div>
      </main>
    </div>
  );
}
