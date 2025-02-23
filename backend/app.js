const express = require("express");
const Docker = require("dockerode");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const docker = new Docker();
const PORT = 3001;

app.use(cors());

app.use(bodyParser.json());

function saveCppFile(code) {
    const filePath = path.join(__dirname, "docker", "main.cpp");
    fs.writeFileSync(filePath, code);
    return filePath;
}

async function buildDockerImage() {
    return new Promise((resolve, reject) => {
        docker.buildImage(
            {
                context: path.join(__dirname, "docker"),
                src: ["Dockerfile", "main.cpp"],
            },
            { t: "cpp-compiler" },
            (err, stream) => {
                if (err) return reject(err);
                docker.modem.followProgress(stream, (err, output) => {
                    if (err) reject(err);
                    else resolve(output);
                });
            }
        );
    });
}

async function runCppInDocker(inputData) {
    const container = await docker.createContainer({
        Image: "cpp-compiler",
        Tty: false,
        AttachStdout: true,
        AttachStderr: true,
        AttachStdin: true,
    });

    await container.start();

    let isTimeout = false;

    try {
        const exec = await container.exec({
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            // Cmd: ["cat", "/app/output.txt"],
            Cmd: ["sh", "-c", "./main"],
        });

        return new Promise(async (resolve, reject) => {
            exec.start({ hijack: true, stdin: true }, async (err, stream) => {
                if (err) {
                    console.error("Exec Error:", err);
                    return reject(err);
                }

                let output = "";

                const timer = setTimeout(async () => {
                    isTimeout = true;
                    await container.stop();
                    await container.remove();
                    resolve("Execution Timed Out");
                }, 2000);

                docker.modem.demuxStream(stream, process.stdout, process.stderr);

                console.log(err);

                const stdinStream = require("stream").Readable.from([inputData + "\n"]);
                stdinStream.pipe(stream);
                
                stream.on("data", (chunk) => {
                    output += chunk.toString();
                });

                stream.on("end", async () => {
                    clearTimeout(timer);
                    if (!isTimeout) {
                        await container.wait();
                        await container.remove();
                        resolve(output.trim());
                    }
                });
            });
        });
    } catch (error) {
        console.error("Exec command failed:", error);
        await container.remove();
        return "Error";
    }
}

app.post("/run", async (req, res) => {
    const code = req.body.code;
    const test = req.body.test.input;
    if (!code) return res.status(400).json({ error: "No C++ code provided" });

    try {
        console.log("Received C++ code:", code);
        saveCppFile(code);
        await buildDockerImage();
        const output = await runCppInDocker(test);
        res.json({ output });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: err.message || "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});
