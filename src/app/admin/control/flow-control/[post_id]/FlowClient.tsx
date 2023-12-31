"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { env } from "~/env.mjs";
import ArrowIcon from "~/icons/Arrow";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { Photography } from "~/types/db";
import PlusIcon from "~/icons/Plus";
import MinusIcon from "~/icons/Minus";
import Link from "next/link";
import { useRouter } from "next/navigation";
import XCircle from "~/icons/XCircle";

export default function FlowClient(props: { post: Photography }) {
  const [flow, setFlow] = useState<{ [row: number]: string[] }>();
  const [firstLoadFinished, setFirstLoadFinished] = useState<boolean>(false);
  const [attachmentArray, setAttachmentArray] = useState<{ src: string }[]>([]);
  const [showingLightbox, setShowingLightbox] = useState<boolean>(false);
  const [flowSaving, setFlowSaving] = useState<boolean>(false);
  const clickedImageRef = useRef<number>(0);

  const router = useRouter();

  function createFlowState() {
    if (props.post.photography_flow) {
      const flow = props.post.photography_flow;
      setFlow(flow);
      let localAttachments = props.post.images?.split("\\,");
      let srced: { src: string }[] = [];
      localAttachments?.forEach((attachment) =>
        srced.push({ src: env.NEXT_PUBLIC_AWS_BUCKET_STRING + attachment }),
      );
      setAttachmentArray(srced);
    } else {
      if (props.post.images) {
        // render default flowState
        let localAttachments = props.post.images.split("\\,");
        console.log("local attachments" + localAttachments);
        let srced: { src: string }[] = [];
        localAttachments.forEach((attachment) =>
          srced.push({ src: env.NEXT_PUBLIC_AWS_BUCKET_STRING + attachment }),
        );
        setAttachmentArray(srced);

        let necessaryRows = Math.ceil(localAttachments.length / 3);

        for (let n = 0; n < necessaryRows; n++) {
          setFlow((prevState) => ({
            ...prevState,
            [n]: localAttachments.slice(n * 3, n * 3 + 3),
          }));
        }
      }
    }
  }

  useEffect(() => {
    createFlowState();
    setFirstLoadFinished(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function moveImageUp(row: number, col: number) {
    //target is ((row - 1), col)
    if (row > 0) {
      let newFlow = { ...flow! };
      let targetRowArr = [...newFlow[row - 1]];
      let sourceRowArr = [...newFlow[row]];
      targetRowArr.splice(col, 0, sourceRowArr[col]);
      sourceRowArr.splice(col, 1);
      newFlow[row - 1] = targetRowArr;
      newFlow[row] = sourceRowArr;
      setFlow(newFlow);
    }
  }

  function deleteImageFromFlow(image: string) {
    if (flow) {
      const confirm = window.confirm("delete image?");
      if (confirm) {
        let newFlow: { [row: number]: string[] } = {};
        Object.entries(flow).forEach(([row, values]) => {
          let newValues: string[] = [];
          values.forEach((value) => {
            if (value !== image) {
              newValues.push(value);
            }
          });
          newFlow[+row] = newValues;
        });
        setFlow(newFlow);
        removeImageFromImages(image);
      }
    }
  }

  const removeImageFromImages = async (key: string) => {
    const imgStringArr = props.post.images!.split("\\,");
    const newString = imgStringArr.filter((str) => str !== key).join("\\,");
    await fetch("/api/s3/deleteImage", {
      method: "POST",
      body: JSON.stringify({
        key: key,
        newAttachmentString: newString,
        id: props.post.id,
      }),
    });
  };

  function moveImageLeft(row: number, col: number) {
    //target is (row, (col - 1))
    let newFlow = { ...flow! };
    let newArr = [...newFlow[row]];
    const temp = newArr[col];
    newArr[col] = newArr[col - 1];
    newArr[col - 1] = temp;
    newFlow[row] = newArr;
    setFlow(newFlow);
  }
  function moveImageRight(row: number, col: number) {
    //target is (row, (col + 1))
    let newFlow = { ...flow! };
    let newArr = [...newFlow[row]];
    const temp = newArr[col];
    newArr[col] = newArr[col + 1];
    newArr[col + 1] = temp;
    newFlow[row] = newArr;
    setFlow(newFlow);
  }
  function moveImageDown(row: number, col: number) {
    //target is ((row + 1), col)
    if (row < Object.keys(flow!).length - 1) {
      let newFlow = { ...flow! };
      let targetRowArr = [...newFlow[row + 1]];
      let sourceRowArr = [...newFlow[row]];
      targetRowArr.splice(col, 0, sourceRowArr[col]);
      sourceRowArr.splice(col, 1);
      newFlow[row + 1] = targetRowArr;
      newFlow[row] = sourceRowArr;
      setFlow(newFlow);
    }
  }

  function moveRowUp(row: number) {
    if (flow && row > 0) {
      let newFlow = { ...flow };

      [newFlow[row], newFlow[row - 1]] = [newFlow[row - 1], newFlow[row]];

      setFlow(newFlow);
    }
  }

  function moveRowDown(row: number) {
    if (flow && row < Object.entries(flow).length - 1) {
      let newFlow = { ...flow };

      [newFlow[row], newFlow[row + 1]] = [newFlow[row + 1], newFlow[row]];

      setFlow(newFlow);
    }
  }

  function openLightbox(imageSrc: string) {
    const idx = attachmentArray.findIndex(
      (attachment) =>
        attachment.src == env.NEXT_PUBLIC_AWS_BUCKET_STRING + imageSrc,
    );
    clickedImageRef.current = idx;
    setShowingLightbox(true);
  }

  function addRowTop() {
    if (flow) {
      let newFlow: { [row: number]: string[] } = { 0: [] };
      Object.entries(flow).forEach(([key, values]) => {
        newFlow[+key + 1] = values;
      });
      setFlow(newFlow);
    }
  }

  function addRowAtN(index: number) {
    if (flow) {
      let newFlow: { [row: number]: string[] } = {};

      Object.entries(flow).forEach(([key, values]) => {
        const adjustedKey = +key >= index ? +key + 1 : +key;
        newFlow[adjustedKey] = values;
      });

      newFlow[index] = [];

      setFlow(newFlow);
    }
  }

  function goToEdit() {
    const confirm = window.confirm("Would you like to save your current flow?");
    if (confirm) {
      saveFlow();
    }
    router.push(`/admin/control/edit/photography/${props.post.id}`);
  }

  function removeRow(row: number) {
    if (flow) {
      const newFlow = Object.keys(flow)
        .filter((key) => +key !== row)
        .reduce(
          (obj, key, index) => {
            obj[index] = flow[+key];
            return obj;
          },
          {} as { [row: number]: string[] },
        );
      setFlow(newFlow);
    }
  }

  async function saveFlow() {
    setFlowSaving(true);
    const data = { id: props.post.id, photography_flow: flow };
    console.log(data);
    await fetch(`/api/database/photography/update`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setFlowSaving(false);
  }

  while (!firstLoadFinished) {
    return (
      <div className="py-4 px-8">
        <div className="text-zinc-800 text-3xl tracking-wider text-center pb-8">
          {props.post.title.replaceAll("_", " ")} Photography Flow
        </div>
        <div className="flex justify-center">
          <div className="flex flex-col">
            <div className="animate-spin">
              <Image
                src={"/circle-logo.png"}
                alt={"logo"}
                height={80}
                width={80}
              />
            </div>
            <div>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (flow) {
    return (
      <>
        <div className="py-4 px-8">
          <div className="text-zinc-800 text-3xl tracking-wider text-center pb-8">
            {props.post.title.replaceAll("_", " ")} Photography Flow
          </div>
          <div
            id="flow control"
            className="p-4 w-full flex justify-center flex-col"
          >
            <div className="py-4 px-12 w-fit rounded-md bg-zinc-200 mx-auto">
              <div className="text-center text-2xl tracking-wide">Add Row</div>
              <div className="flex justify-center">
                <button
                  onClick={addRowTop}
                  className="transform opacity-90 hover:opacity-100 z-10 bg-emerald-300 p-1 hover:bg-emerald-400 active:scale-90 transition-all ease-in-out duration-300 rounded-md"
                >
                  <PlusIcon
                    height={24}
                    width={24}
                    strokeWidth={2}
                    stroke={"#27272a"}
                  />
                </button>
              </div>
            </div>
            {Object.entries(flow).map(([row, values]) => (
              <div key={row}>
                <div className="flex flex-col w-4/5 h-fit py-4 my-4 mx-auto bg-zinc-200 rounded">
                  <div className="flex flex-row justify-evenly ">
                    {values.map((leaf) => (
                      <div key={leaf} className="w-1/3 my-auto px-2 py-4">
                        {+row > 0 ? (
                          <div className="relative flex items-center">
                            <button
                              id="up-arrow"
                              onClick={() =>
                                moveImageUp(+row, values.indexOf(leaf))
                              }
                              className="absolute top-2 transform opacity-50 hover:opacity-100 -translate-x-1/2 left-1/2 z-10 bg-emerald-300 p-1 hover:bg-emerald-400 active:scale-90 transition-all ease-in-out duration-300 rounded-md"
                            >
                              <div className="rotate-180">
                                <ArrowIcon
                                  width={24}
                                  height={24}
                                  strokeWidth={2.5}
                                  stroke={"#3f3f46"}
                                />
                              </div>
                            </button>
                          </div>
                        ) : null}
                        <div className="relative flex items-center">
                          {values.indexOf(leaf) > 0 ? (
                            <button
                              id="left-arrow"
                              onClick={() =>
                                moveImageLeft(+row, values.indexOf(leaf))
                              }
                              className="absolute left-4 transform opacity-50 hover:opacity-100 -translate-y-1/2 top-1/2 bg-emerald-300 p-1 hover:bg-emerald-400 active:scale-90 transition-all ease-in-out duration-300 rounded-md"
                            >
                              <div className="rotate-90">
                                <ArrowIcon
                                  width={24}
                                  height={24}
                                  strokeWidth={2.5}
                                  stroke={"#3f3f46"}
                                />
                              </div>
                            </button>
                          ) : null}
                          <div className="rounded-sm w-full bg-opacity-50">
                            <div className="absolute w-full h-fit ml-[40%]">
                              <div
                                className="mt-24 z-10 bg-white w-fit bg-opacity-0 hover:bg-opacity-50 opacity-0 transition-all ease-in-out duration-300 hover:opacity-100"
                                onClick={() => deleteImageFromFlow(leaf)}
                              >
                                <XCircle
                                  height={72}
                                  width={72}
                                  stroke={"black"}
                                  strokeWidth={1}
                                />
                              </div>
                            </div>
                            <img
                              alt={"image_" + row + "_" + values.indexOf(leaf)}
                              src={env.NEXT_PUBLIC_AWS_BUCKET_STRING + leaf}
                              className="h-64 mx-auto"
                              onClick={() => openLightbox(leaf)}
                            />
                          </div>
                          {values.indexOf(leaf) < values.length - 1 ? (
                            <button
                              id="right-arrow"
                              onClick={() =>
                                moveImageRight(+row, values.indexOf(leaf))
                              }
                              className="absolute right-4 transform opacity-50 hover:opacity-100 -translate-y-1/2 top-1/2 bg-emerald-300 p-1 hover:bg-emerald-400 active:scale-90 transition-all ease-in-out duration-300 rounded-md"
                            >
                              <div className="-rotate-90">
                                <ArrowIcon
                                  width={24}
                                  height={24}
                                  strokeWidth={2.5}
                                  stroke={"#3f3f46"}
                                />
                              </div>
                            </button>
                          ) : null}
                        </div>
                        {+row < Object.keys(flow).length - 1 ? (
                          <div className="relative flex items-center">
                            <button
                              id="down-arrow"
                              onClick={() =>
                                moveImageDown(+row, values.indexOf(leaf))
                              }
                              className="absolute bottom-2 transform opacity-50 hover:opacity-100 -translate-x-1/2 left-1/2 z-10 bg-emerald-300 p-1 hover:bg-emerald-400 active:scale-90 transition-all ease-in-out duration-300 rounded-md"
                            >
                              <ArrowIcon
                                width={24}
                                height={24}
                                strokeWidth={2.5}
                                stroke={"#3f3f46"}
                              />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {values.length == 0 ? (
                      <div className="flex flex-col">
                        <div className="flex justify-center">
                          <button
                            onClick={() => removeRow(+row)}
                            className="transform opacity-90 hover:opacity-100 z-10 bg-emerald-300 p-1 hover:bg-emerald-400 active:scale-90 transition-all ease-in-out duration-300 rounded-md"
                          >
                            <MinusIcon
                              height={24}
                              width={24}
                              strokeWidth={2}
                              stroke={"#27272a"}
                            />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex justify-center rounded-md bg-zinc-600 w-fit py-2 mt-1 px-4 mx-auto">
                    {+row > 0 ? (
                      <button
                        onClick={() => moveRowUp(+row)}
                        className="transform opacity-90 hover:opacity-100 z-10 bg-emerald-300 p-1 hover:bg-emerald-400 active:scale-90 transition-all ease-in-out duration-300 rounded-md mx-1"
                      >
                        <div className="rotate-180">
                          <ArrowIcon
                            height={24}
                            width={24}
                            strokeWidth={2}
                            stroke={"#27272a"}
                          />
                        </div>
                      </button>
                    ) : null}
                    {+row < Object.entries(flow).length - 1 ? (
                      <button
                        onClick={() => moveRowDown(+row)}
                        className="transform opacity-90 hover:opacity-100 z-10 bg-emerald-300 p-1 hover:bg-emerald-400 active:scale-90 transition-all ease-in-out duration-300 rounded-md mx-1"
                      >
                        <ArrowIcon
                          height={24}
                          width={24}
                          strokeWidth={2}
                          stroke={"#27272a"}
                        />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => addRowAtN(+row + 1)}
                    className="transform opacity-90 hover:opacity-100 z-10 bg-emerald-300 p-1 hover:bg-emerald-400 active:scale-90 transition-all ease-in-out duration-300 rounded-md"
                  >
                    <PlusIcon
                      height={24}
                      width={24}
                      strokeWidth={2}
                      stroke={"#27272a"}
                    />
                  </button>
                </div>
              </div>
            ))}
            <div className="mx-auto my-4">
              <button
                disabled={flowSaving}
                className={`${
                  flowSaving
                    ? "bg-zinc-400"
                    : "bg-emerald-300 opacity-90 hover:opacity-100 hover:bg-emerald-400"
                } py-4 text-lg mx-1 px-6 transform text-white z-10 bg-emerald-300 p-1 active:scale-90 transition-all ease-in-out duration-300 rounded-md`}
                onClick={saveFlow}
              >
                {flowSaving ? "Loading..." : "Save Flow"}
              </button>
              <Link href={`/photography/${props.post.title}`}>
                <button className="py-4 mx-1 text-lg px-6 transform text-white opacity-90 hover:opacity-100 z-10 bg-blue-300 p-1 hover:bg-blue-400 active:scale-90 transition-all ease-in-out duration-300 rounded-md">
                  Go To Post
                </button>
              </Link>
            </div>
            <div className="mx-auto">
              <button
                onClick={goToEdit}
                className="py-4 text-lg px-6 text-white transform opacity-90 hover:opacity-100 z-10 bg-blue-300 p-1 hover:bg-blue-400 active:scale-90 transition-all ease-in-out duration-300 rounded-md"
              >
                Edit Album
              </button>
            </div>
          </div>
        </div>
        <Lightbox
          open={showingLightbox}
          close={() => setShowingLightbox(false)}
          slides={attachmentArray}
          index={clickedImageRef.current}
          plugins={[Zoom]}
        />
      </>
    );
  } else
    return (
      <div className="py-4 px-8">
        <div className="text-zinc-800 text-3xl tracking-wider text-center pb-8">
          {props.post.title.replaceAll("_", " ")} Photography Flow
        </div>
        <div>Fatal error loading data</div>
      </div>
    );
}
