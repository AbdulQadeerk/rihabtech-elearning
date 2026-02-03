# Bunny.net Integration Guide

## 1. Required Credentials

To fully enable video streaming and file storage features, the following credentials from your Bunny.net account are required. These should be added to the `.env` file of the project.

### A. Video Streaming (Bunny Stream)
These credentials are used for uploading and streaming course videos.
*   **Library ID**: 
    *   *Where to find*: Go to **Stream** -> Select your Video Library -> **API & Settings** -> Look for **Library ID**.
*   **API Key**: 
    *   *Where to find*: Go to **Stream** -> Select your Video Library -> **API & Settings** -> Look for **API Key**.
*   **CDN Hostname**: 
    *   *Where to find*: Go to **Stream** -> Select your Video Library -> **API & Settings** -> Look for **CDN Hostname** (e.g., `vz-xxxx.b-cdn.net`).

### B. File Storage (Bunny Storage)
These credentials are used for uploading images, documents, and other static assets.
*   **Storage Zone Name**: 
    *   *Where to find*: Go to **Storage** -> Copy the name of your storage zone.
*   **Storage Password**: 
    *   *Where to find*: Go to **Storage** -> Select your Storage Zone -> **FTP & API Access** -> Copy the **Password**.
*   **Pull Zone Domain**: 
    *   *Where to find*: Go to **Pull Zones** -> Select the zone linked to your storage -> Copy the **Hostname** (e.g., `your-app.b-cdn.net`).

---

## 2. Integration Technical Overview

We have integrated Bunny.net to handle the platform's media requirements effectively. Here is a brief summary of the technical implementation:

### 📹 Video Streaming (Bunny Stream)
*   **Upload Process**: When an instructor uploads a video, the application directly communicates with the Bunny Stream API to creates a video entry and uploads the file content.
*   **Format Strategy**: We strictly utilize **HLS (HTTP Live Streaming)** technology. Upon upload, we generate and store the `playlist.m3u8` URL.
    *   *Why HLS?* This allows for **Adaptative Bitrate Streaming**, meaning the video quality automatically adjusts based on the student's internet speed (like YouTube or Netflix), ensuring smooth playback without buffering.
*   **Playback**: The frontend uses a specialized player (`ReactPlayer`) capable of rendering these HLS streams across all modern browsers and devices.

### 📁 Static Asset Storage (Bunny Storage)
*   **Implementation**: A dedicated module serves as an interface to Bunny Storage.
*   **Functionality**: Images (course thumbnails, user avatars) and course documents (PDFs, resources) are uploaded to a secure Storage Zone.
*   **Delivery**: These files are delivered via a high-performance **Pull Zone (CDN)**, ensuring fast load times for users regardless of their geographic location.

### 🚀 Key Benefits
*   **Performance**: Improved video buffering speeds and faster image loading.
*   **Cost-Efficiency**: Replaces more expensive legacy providers.
*   **Scalability**: The infrastructure is designed to handle thousands of concurrent users and unlimited media uploads.
