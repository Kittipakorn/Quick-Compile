import type { Route } from "./+types/home";
import { useState, useRef, useEffect } from "react";
import { Editor } from "@monaco-editor/react";


export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Quick Compile" },
    { name: "Quick Compile, compiler for competitive programming", content: "Welcome to React Router!" },
  ];
}

export default function Home() {

  const [code, setCode] = useState(
    `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello, C++ Editor!" << endl;\n    return 0;\n}`
  );
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const isResizingSidebar = useRef(false);
  const lastCode = useRef(code)

  const handleCodeChange = (newCode) => {
    if (newCode !== lastCode.current) {
      setCode(newCode);
      lastCode.current = newCode;
    }
  };

  const handleMouseDownSidebar = (e: React.MouseEvent) => {
    isResizingSidebar.current = true;
    e.preventDefault()
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMoveSidebar);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMoveSidebar = (e: MouseEvent) => {
    if (isResizingSidebar.current) {
      const newWidth = e.clientX;
      if (newWidth >= 300 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    isResizingSidebar.current = false;
    document.body.style.userSelect = "auto";
    document.removeEventListener("mousemove", handleMouseMoveSidebar);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const [testcase, setTestcase] = useState([
    { index: 1, input: "", expected: "", received: "-" }
  ]);

  const removeTestcase = (index) => {
    const updatedTestcases = testcase.filter((item) => item.index !== index);
    const reorderedTestcases = updatedTestcases.map((item, newIndex) => ({
      ...item,
      index: newIndex + 1,
    }));
    setTestcase(reorderedTestcases);
  };

  const addTestcase = () => {
    const newId = testcase.length + 1;
    setTestcase([...testcase, { index: newId, input: "", expected: "", received: "-" }]);
  };

  const runCode = async (test) => {
    const data = { "code": code, "test": test };
    try {
      const response = await fetch("http://localhost:3001/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      const cleanOutput = (output) => {
        return output
          .replace(/[\x00-\x1F\x7F]/g, "")
          .trim();
      };

      const cleaned = cleanOutput(result.output);

      setTestcase((prevTestcase) =>
        prevTestcase.map((t) =>
          t.index === test.index ? { ...t, received: cleaned } : t
        )
      );
      console.log("Response from Server:", result);
    } catch (error) {
      console.error("Error sending data:", error);
    }
  };

  const runAll = async () => {
    testcase.map(async (item) => {
      await runCode(item);
    })
  };


  return (
    <>
      <main className="min-h-full min-w-full m-5">
        <div className="text-center m-5">
          <h1 className="font-semibold text-white text-3xl">
            Quick Compile
          </h1>
          <p className=" text-gray-400 mt-3">
            Compiler for competitive programming
          </p>
        </div>

        <div className="flex">
          <div className="bg-[#1c1c1c] rounded-2xl flex flex-col justify-between h-[83vh] p-3 border-r border-gray-800" style={{ width: `${sidebarWidth}px` }}>
            <div>
              <div className="flex mb-3 mx-2 my-1 justify-between">
                <h1 className="text-gray-200 font-semibold">Test case</h1>
                <div className="text-green-600 hover:text-green-800 cursor-pointer" onClick={addTestcase}>+ New</div>
              </div>
              <div className="flex flex-col overflow-auto mx-1 max-h-[70vh]">
                {testcase.map(item => (
                  <div key={item.index} className="flex flex-col text-sm bg-gray-800 p-2 pb-4 pr-4 rounded-lg mb-3">

                    <div className="flex justify-between mt-1">
                      <p className="font-semibold text-xl mb-1" style={{ color:  item.expected == item.received? "green" : "red" }} >Test case {item.index}</p>
                      <div className="flex gap-2 mt-1">
                        <div className="bg-red-700 hover:bg-red-800 p-1 text-white rounded-md"
                          onClick={() => removeTestcase(item.index)}
                        >Delete</div>
                        <div className="bg-green-700 hover:bg-green-800 px-3 p-1 text-white rounded-md" onClick={() => runCode(item)}>Run</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-300">Input :</div>
                      <textarea className="bg-gray-900 p-1 mx-1 mt-1 w-full rounded-sm text-white" value={item.input}
                        onChange={(e) =>
                          setTestcase((prevTestcase) =>
                            prevTestcase.map((t) =>
                              t.index === item.index ? { ...t, input: e.target.value } : t
                            )
                          )
                        } />
                    </div>

                    <div>
                      <div className="text-gray-300">Expected output :</div>
                      <input className="bg-gray-900 p-1 mt-1 mx-1 w-full rounded-sm text-white" type="text" value={item.expected}
                        onChange={(e) =>
                          setTestcase((prevTestcase) =>
                            prevTestcase.map((t) =>
                              t.index === item.index ? { ...t, expected: e.target.value } : t
                            )
                          )
                        } />
                    </div>

                    <div>
                      <div className="text-gray-300">Received output :</div>
                      <div className="bg-gray-900 p-1 mt-1 mx-1 w-full rounded-sm text-white">{item.received}</div>
                    </div>
                  </div>
                ))}

              </div>
            </div>
            <div className="flex mt-3 mx-2 my-1 justify-end">
              <div className="text-white hover:bg-green-800 cursor-pointer rounded-md bg-green-600 py-1 px-5" onClick={runAll}>Run All</div>
            </div>
          </div>
          <div className="h-[80vh] my-auto hover:opacity-85 opacity-5 w-1 mx-1 bg-white cursor-ew-resize rounded-2xl"
            onMouseDown={handleMouseDownSidebar}></div>

          <div className="flex-1 flex flex-col border bg-[#1c1c1c] rounded-2xl mr-10">
            <h1 className="font-semibold text-left text-white my-3 ml-5">
              C++ Code
            </h1>

            <Editor
              height="90%"
              width="99%"
              language="cpp"
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                inlineSuggest: true,
                fontSize: "12px",
                formatOnType: true,
                minimap: { scale: 0 }
              }}
            />
          </div>
        </div>
      </main>
    </>
  )
}
