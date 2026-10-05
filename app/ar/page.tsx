"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";

export default function ARPage() {
  const [aframeLoaded, setAframeLoaded] = useState(false);
  const [arjsLoaded, setArjsLoaded] = useState(false);
  const [arReady, setArReady] = useState(false);

  useEffect(() => {
    const handleARLoaded = () => {
      console.log("AR.js NFT loaded");
      setArReady(true);
    };

    window.addEventListener("arjs-nft-loaded", handleARLoaded);

    return () => {
      window.removeEventListener("arjs-nft-loaded", handleARLoaded);
    };
  }, []);

  return (
    <>
      {/* =========================
          GLOBAL AR STYLES
      ========================== */}
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

        main {
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Camera video created by AR.js */
        video {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;

          width: 100vw !important;
          height: 100vh !important;

          object-fit: cover !important;

          margin: 0 !important;
          padding: 0 !important;

          z-index: 0 !important;
        }

        /* A-Frame scene */
        a-scene {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;

          width: 100vw !important;
          height: 100vh !important;

          margin: 0 !important;
          padding: 0 !important;

          z-index: 1 !important;
        }

        /* WebGL canvas */
        .a-canvas {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;

          width: 100vw !important;
          height: 100vh !important;

          margin: 0 !important;
          padding: 0 !important;
        }
      `}</style>

      {/* =========================
          LOAD A-FRAME
      ========================== */}
      <Script
        src="https://aframe.io/releases/1.6.0/aframe.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("A-Frame loaded");
          setAframeLoaded(true);
        }}
      />

      {/* =========================
          LOAD AR.JS
          Only after A-Frame loads
      ========================== */}
      {aframeLoaded && (
        <Script
          src="https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log("AR.js loaded");
            setArjsLoaded(true);
          }}
        />
      )}

      {/* =========================
          PAGE
      ========================== */}
      <main
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          background: "#000",
        }}
      >
        {/* =========================
            LOADING MESSAGE
        ========================== */}
        {!arReady && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",

              zIndex: 9999,

              background: "rgba(0, 0, 0, 0.75)",
              color: "#fff",

              padding: "12px 20px",
              borderRadius: "8px",

              fontFamily: "Arial, sans-serif",
              fontSize: "14px",

              whiteSpace: "nowrap",
            }}
          >
            {!aframeLoaded
              ? "Loading A-Frame..."
              : !arjsLoaded
                ? "Loading AR.js..."
                : "Starting camera..."}
          </div>
        )}

        {/* =========================
            AR SCENE
        ========================== */}
        {aframeLoaded &&
          arjsLoaded &&
          React.createElement(
            "a-scene",
            {
              embedded: true,

              "vr-mode-ui": "enabled: false",

              renderer:
                "logarithmicDepthBuffer: true; antialias: true; alpha: true;",

              arjs: `
                trackingMethod: best;
                sourceType: webcam;
                debugUIEnabled: false;
              `,
            },

            /*
             * =========================
             * PHILIPPINE FLAG TARGET
             * =========================
             *
             * Files:
             *
             * public/markers/flag.fset
             * public/markers/flag.fset3
             * public/markers/flag.iset
             *
             */

            React.createElement(
              "a-nft",
              {
                type: "nft",

                // IMPORTANT:
                // Do NOT add .fset here
                url: "/markers/flag",

                smooth: "true",
                smoothCount: "10",
                smoothTolerance: "0.01",
                smoothThreshold: "5",
              },

              /*
               * =========================
               * TEST AR OBJECT
               * =========================
               *
               * A red box should appear
               * when the flag is detected.
               */

              React.createElement("a-box", {
                position: "50 100 0",
                scale: "20 20 20",
                material: "color: red;",
              })
            ),

            /*
             * =========================
             * CAMERA
             * =========================
             */

            React.createElement("a-entity", {
              camera: "",
            })
          )}
      </main>
    </>
  );
}
