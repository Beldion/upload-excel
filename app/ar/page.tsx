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
      {/* Load A-Frame */}
      <Script
        src="https://aframe.io/releases/1.6.0/aframe.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("A-Frame loaded");
          setAframeLoaded(true);
        }}
      />

      {/* Load AR.js after A-Frame */}
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

      <main
        style={{
          width: "100vw",
          height: "100vh",
          margin: 0,
          padding: 0,
          overflow: "hidden",
          position: "relative",
          background: "#000",
        }}
      >
        {/* Loading */}
        {!arReady && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: "8px",
              fontFamily: "Arial, sans-serif",
              fontSize: "14px",
            }}
          >
            {!aframeLoaded
              ? "Loading A-Frame..."
              : !arjsLoaded
                ? "Loading AR.js..."
                : "Starting camera..."}
          </div>
        )}

        {/* AR Scene */}
        {aframeLoaded &&
          arjsLoaded &&
          React.createElement(
            "a-scene",
            {
              embedded: true,
              "vr-mode-ui": "enabled: false",
              renderer: "logarithmicDepthBuffer: true;",
              arjs: `
                trackingMethod: best;
                sourceType: webcam;
                debugUIEnabled: false;
              `,
            },

            // NFT IMAGE TARGET
            React.createElement(
              "a-nft",
              {
                type: "nft",
                url: "/markers/poster",
                smooth: "true",
                smoothCount: "10",
                smoothTolerance: "0.01",
                smoothThreshold: "5",
              },

              // RED TEST BOX
              React.createElement("a-box", {
                position: "50 100 0",
                scale: "20 20 20",
                material: "color: red;",
              })
            ),

            // CAMERA
            React.createElement("a-entity", {
              camera: "",
            })
          )}
      </main>
    </>
  );
}
