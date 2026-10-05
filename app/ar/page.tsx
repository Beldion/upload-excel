"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";

export default function ARPage() {
  const [aframeLoaded, setAframeLoaded] = useState(false);
  const [arjsLoaded, setArjsLoaded] = useState(false);

  const [markerReady, setMarkerReady] = useState(false);
  const [detected, setDetected] = useState(false);

  const [message, setMessage] = useState("Loading A-Frame...");

  // ==========================================
  // AR.JS GLOBAL EVENTS
  // ==========================================

  useEffect(() => {
    const handleNFTLoaded = () => {
      console.log("NFT DESCRIPTORS LOADED");

      setMarkerReady(true);
      setMessage("🔍 SCANNING FOR FLAG...");
    };

    window.addEventListener("arjs-nft-loaded", handleNFTLoaded);

    return () => {
      window.removeEventListener(
        "arjs-nft-loaded",
        handleNFTLoaded
      );
    };
  }, []);

  // ==========================================
  // MARKER EVENTS
  // ==========================================

  useEffect(() => {
    if (!arjsLoaded) return;

    let marker: Element | null = null;

    const setupMarker = () => {
      marker = document.querySelector("#flag-marker");

      if (!marker) {
        console.log("Marker not found yet.");

        setMessage("Waiting for marker...");

        return false;
      }

      console.log("Marker element found.");

      const handleMarkerFound = () => {
        console.log("FLAG DETECTED");

        setDetected(true);
        setMessage("✅ FLAG DETECTED!");
      };

      const handleMarkerLost = () => {
        console.log("FLAG LOST");

        setDetected(false);
        setMessage("🔍 SCANNING FOR FLAG...");
      };

      marker.addEventListener(
        "markerFound",
        handleMarkerFound
      );

      marker.addEventListener(
        "markerLost",
        handleMarkerLost
      );

      return true;
    };

    // Give React/A-Frame a moment to create the marker.
    const interval = window.setInterval(() => {
      const success = setupMarker();

      if (success) {
        window.clearInterval(interval);
      }
    }, 500);

    return () => {
      window.clearInterval(interval);
    };
  }, [arjsLoaded]);

  return (
    <>
      {/* =====================================
          GLOBAL CSS
      ====================================== */}

      <style jsx global>{`

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;

          width: 100% !important;
          height: 100% !important;

          overflow: hidden !important;

          background: black !important;
        }

        body {
          position: fixed !important;

          top: 0;
          left: 0;

          width: 100vw !important;
          height: 100vh !important;
        }

        /*
         * AR.js camera
         */
        video {
          position: fixed !important;

          top: 0 !important;
          left: 0 !important;

          width: 100vw !important;
          height: 100vh !important;

          object-fit: cover !important;

          margin: 0 !important;
          padding: 0 !important;
        }

        /*
         * A-Frame Scene
         */
        a-scene {
          position: fixed !important;

          top: 0 !important;
          left: 0 !important;

          width: 100vw !important;
          height: 100vh !important;
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
        }

      `}</style>

      {/* =====================================
          A-FRAME
      ====================================== */}

      <Script
        src="https://aframe.io/releases/1.6.0/aframe.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("A-FRAME LOADED");

          setAframeLoaded(true);
          setMessage("Loading AR.js...");
        }}
      />

      {/* =====================================
          AR.JS
      ====================================== */}

      {aframeLoaded && (
        <Script
          src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log("AR.JS LOADED");

            setArjsLoaded(true);
            setMessage("Loading flag marker...");
          }}
        />
      )}

      {/* =====================================
          AR CONTAINER
      ====================================== */}

      <div
        id="ar-container"
        style={{
          position: "fixed",

          top: 0,
          left: 0,

          width: "100vw",
          height: "100vh",

          overflow: "hidden",

          background: "#000",

          zIndex: 1,
        }}
      >
        {/* =====================================
            CREATE AR SCENE
        ====================================== */}

        {aframeLoaded &&
          arjsLoaded &&
          React.createElement(
            "a-scene",

            {
              embedded: true,

              "vr-mode-ui":
                "enabled: false",

              renderer:
                "logarithmicDepthBuffer: true; antialias: true; alpha: true;",

              arjs: `
                trackingMethod: best;
                sourceType: webcam;
                debugUIEnabled: false;
              `,
            },

            // ==================================
            // FLAG MARKER
            // ==================================

            React.createElement(
              "a-nft",

              {
                id: "flag-marker",

                type: "nft",

                // Looks for:
                //
                // /markers/flag.fset
                // /markers/flag.fset3
                // /markers/flag.iset

                url: "/markers/flag",

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

                material:
                  "color: red; opacity: 1;",
              })
            ),

            // ==================================
            // CAMERA
            // ==================================

            React.createElement(
              "a-entity",
              {
                camera: "",
              }
            )
          )}
      </div>

      {/* =====================================
          DEBUG OVERLAY

          IMPORTANT:
          This is OUTSIDE the AR container.
      ====================================== */}

      <div
        style={{
          position: "fixed",

          top: "20px",
          left: "50%",

          transform: "translateX(-50%)",

          width: "calc(100% - 40px)",
          maxWidth: "400px",

          zIndex: 2147483647,

          background: detected
            ? "rgba(0, 150, 0, 0.95)"
            : "rgba(0, 0, 0, 0.85)",

          color: "white",

          padding: "14px",

          borderRadius: "10px",

          boxSizing: "border-box",

          fontFamily: "Arial, sans-serif",

          textAlign: "center",

          pointerEvents: "none",
        }}
      >
        {/* Main status */}

        <div
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          {message}
        </div>

        {/* Debug details */}

        <div
          style={{
            fontSize: "12px",
            lineHeight: "20px",
            opacity: 0.9,
          }}
        >
          <div>
            A-Frame:
            {" "}
            {aframeLoaded ? "✅" : "❌"}
          </div>

          <div>
            AR.js:
            {" "}
            {arjsLoaded ? "✅" : "❌"}
          </div>

          <div>
            Marker files:
            {" "}
            {markerReady ? "✅" : "⏳"}
          </div>

          <div>
            Flag detected:
            {" "}
            {detected ? "✅ YES" : "❌ NO"}
          </div>
        </div>
      </div>
    </>
  );
}
