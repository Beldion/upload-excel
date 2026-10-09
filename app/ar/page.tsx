
"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";

export default function ARPage() {
  const [aframeLoaded, setAframeLoaded] = useState(false);
  const [arjsLoaded, setArjsLoaded] = useState(false);
  const [markerReady, setMarkerReady] = useState(false);
  const [detected, setDetected] = useState(false);
  const [status, setStatus] = useState("Loading A-Frame...");

  // Listen for NFT marker loading
  useEffect(() => {
    const handleNFTLoaded = () => {
      console.log("Magazine NFT descriptors loaded");
      setMarkerReady(true);
      setStatus("🔍 SCANNING FOR MAGAZINE...");
    };

    window.addEventListener("arjs-nft-loaded", handleNFTLoaded);

    return () => {
      window.removeEventListener(
        "arjs-nft-loaded",
        handleNFTLoaded
      );
    };
  }, []);

  // Listen for marker detection events
  useEffect(() => {
    if (!arjsLoaded) return;

    const marker = document.getElementById("magazine-marker");

    if (!marker) {
      console.warn("Magazine marker not found in DOM");
      return;
    }

    const handleFound = () => {
      console.log("MAGAZINE DETECTED");

      setDetected(true);
      setStatus("✅ MAGAZINE DETECTED!");
    };

    const handleLost = () => {
      console.log("MAGAZINE LOST");

      setDetected(false);
      setStatus("🔍 SCANNING FOR MAGAZINE...");
    };

    marker.addEventListener("markerFound", handleFound);
    marker.addEventListener("markerLost", handleLost);

    console.log("Magazine marker listeners attached");

    return () => {
      marker.removeEventListener("markerFound", handleFound);
      marker.removeEventListener("markerLost", handleLost);
    };
  }, [arjsLoaded]);

  return (
    <>
      {/* GLOBAL CSS */}
      <style jsx global>{`
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          background: #000 !important;
        }

        #arjs-video,
        video {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          object-fit: cover !important;
          margin: 0 !important;
          z-index: 0 !important;
        }

        a-scene {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 1 !important;
        }

        .a-canvas {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 1 !important;
          background: transparent !important;
        }
      `}</style>

      {/* LOAD A-FRAME */}
      <Script
        src="https://aframe.io/releases/1.6.0/aframe.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("A-Frame loaded");
          setAframeLoaded(true);
          setStatus("Loading AR.js...");
        }}
        onError={() => {
          setStatus("❌ Failed to load A-Frame");
        }}
      />

      {/* LOAD AR.JS */}
      {aframeLoaded && (
        <Script
          src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log("AR.js loaded");
            setArjsLoaded(true);
            setStatus("Loading magazine marker...");
          }}
          onError={() => {
            setStatus("❌ Failed to load AR.js");
          }}
        />
      )}

      {/* AR SCENE */}
      {aframeLoaded &&
        arjsLoaded &&
        React.createElement(
          "a-scene",
          {
            embedded: true,
            "vr-mode-ui": "enabled: false",
            renderer:
              "logarithmicDepthBuffer: true; alpha: true; antialias: true;",
            arjs:
              "sourceType: webcam; trackingMethod: best; debugUIEnabled: false;",
          },

          // MAGAZINE NFT TARGET
          React.createElement(
            "a-nft",
            {
              id: "magazine-marker",
              type: "nft",

              // public/marker/test.fset
              // public/marker/test.fset3
              // public/marker/test.iset
              url: "/marker/test",

              smooth: "true",
              smoothCount: "10",
              smoothTolerance: "0.01",
              smoothThreshold: "5",
              emitevents: "true",
            },

            // RED TEST BOX
            React.createElement("a-box", {
              position: "50 50 0",
              scale: "30 30 30",
              material: "color: red;",
            })
          ),

          // CAMERA
          React.createElement("a-entity", {
            camera: "",
          })
        )}

      {/* STATUS OVERLAY */}
      <div
        style={{
          position: "fixed",
          top: "max(20px, env(safe-area-inset-top))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999999,
          padding: "12px 20px",
          background: detected
            ? "rgba(0, 150, 0, 0.9)"
            : "rgba(0, 0, 0, 0.8)",
          color: "#fff",
          borderRadius: "8px",
          fontFamily: "Arial, sans-serif",
          fontSize: "14px",
          fontWeight: "bold",
          textAlign: "center",
          maxWidth: "90vw",
          pointerEvents: "none",
        }}
      >
        <div>{status}</div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "11px",
            fontWeight: "normal",
          }}
        >
          A-Frame: {aframeLoaded ? "✅" : "⏳"}
          {" | "}
          AR.js: {arjsLoaded ? "✅" : "⏳"}
          {" | "}
          NFT: {markerReady ? "✅" : "⏳"}
        </div>
      </div>
    </>
  );
}
