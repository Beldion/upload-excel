"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";

export default function ARPage() {
  const [aframeLoaded, setAframeLoaded] = useState(false);
  const [arjsLoaded, setArjsLoaded] = useState(false);
  const [detected, setDetected] = useState(false);
  const [status, setStatus] = useState("Loading A-Frame...");

  // ============================================
  // Listen for marker found / lost
  // ============================================

  useEffect(() => {
    if (!arjsLoaded) return;

    const interval = window.setInterval(() => {
      const marker = document.getElementById("flag-marker");

      if (!marker) {
        return;
      }

      window.clearInterval(interval);

      console.log("Flag marker found in DOM");

      const handleFound = () => {
        console.log("FLAG DETECTED");

        setDetected(true);
        setStatus("✅ FLAG DETECTED!");
      };

      const handleLost = () => {
        console.log("FLAG LOST");

        setDetected(false);
        setStatus("🔍 SCANNING FOR FLAG...");
      };

      marker.addEventListener("markerFound", handleFound);
      marker.addEventListener("markerLost", handleLost);

      setStatus("🔍 SCANNING FOR FLAG...");
    }, 500);

    return () => {
      window.clearInterval(interval);
    };
  }, [arjsLoaded]);

  return (
    <>
      {/* ========================================
          GLOBAL CSS
      ========================================= */}

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

        /*
         * Camera created by AR.js
         */
        #arjs-video {
          position: fixed !important;

          top: 0 !important;
          left: 0 !important;

          width: 100vw !important;
          height: 100vh !important;

          object-fit: cover !important;

          margin: 0 !important;

          z-index: 0 !important;
        }

        /*
         * Fallback in case AR.js doesn't
         * assign the arjs-video ID.
         */
        video {
          position: fixed !important;

          top: 0 !important;
          left: 0 !important;

          width: 100vw !important;
          height: 100vh !important;

          object-fit: cover !important;

          z-index: 0 !important;
        }

        /*
         * A-Frame scene
         */
        a-scene {
          position: fixed !important;

          top: 0 !important;
          left: 0 !important;

          width: 100vw !important;
          height: 100vh !important;

          z-index: 1 !important;
        }

        /*
         * WebGL canvas
         */
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

      {/* ========================================
          LOAD A-FRAME
      ========================================= */}

      <Script
        src="https://aframe.io/releases/1.6.0/aframe.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("A-Frame loaded");

          setAframeLoaded(true);
          setStatus("Loading AR.js...");
        }}
      />

      {/* ========================================
          LOAD AR.JS
      ========================================= */}

      {aframeLoaded && (
        <Script
          src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log("AR.js loaded");

            setArjsLoaded(true);
            setStatus("Starting camera...");
          }}
        />
      )}

      {/* ========================================
          AR SCENE
      ========================================= */}

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

          // ====================================
          // NFT IMAGE TARGET
          // ====================================

          React.createElement(
            "a-nft",
            {
              id: "flag-marker",

              type: "nft",

              /*
               * IMPORTANT:
               *
               * Your folder is:
               *
               * public/marker/
               *
               * NOT:
               *
               * public/markers/
               */

              url: "/marker/flag",

              smooth: "true",

              smoothCount: "10",

              smoothTolerance: "0.01",

              smoothThreshold: "5",

              emitevents: "true",
            },

            // ==================================
            // RED TEST BOX
            // ==================================

            React.createElement("a-box", {
              position: "50 50 0",

              scale: "30 30 30",

              material: "color: red;",
            })
          ),

          // ====================================
          // CAMERA
          // ====================================

          React.createElement("a-entity", {
            camera: "",
          })
        )}

      {/* ========================================
          STATUS OVERLAY
      ========================================= */}

      <div
        style={{
          position: "fixed",

          top: "20px",
          left: "50%",

          transform: "translateX(-50%)",

          zIndex: 999999,

          padding: "12px 20px",

          background: detected
            ? "rgba(0, 150, 0, 0.9)"
            : "rgba(0, 0, 0, 0.75)",

          color: "#fff",

          borderRadius: "8px",

          fontFamily: "Arial, sans-serif",

          fontSize: "16px",
          fontWeight: "bold",

          whiteSpace: "nowrap",

          pointerEvents: "none",
        }}
      >
        {status}
      </div>
    </>
  );
}
