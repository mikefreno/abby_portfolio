"use client";

import TextEditor from "~/components/TextEditor";
import { useCallback, useEffect, useRef, useState } from "react";
import Dropzone from "~/components/Dropzone";
import { Row } from "~/types/db";
import AddImageToS3 from "../../../create/[type]/s3Upload";
import { useRouter } from "next/navigation";
import { env } from "~/env.mjs";
import XCircle from "~/icons/XCircle";

export default function EditPhotographyForm(project: Row) {
  const [editorContent, setEditorContent] = useState<string>("");
  const [images, setImages] = useState<(File | Blob)[]>([]);
  const [imageHolder, setImageHolder] = useState<(string | ArrayBuffer)[]>([]);
  const [savingAsDraft, setSavingAsDraft] = useState<boolean>(true);
  const [submitButtonLoading, setSubmitButtonLoading] =
    useState<boolean>(false);
  const [deleteButtonLoading, setDeleteButtonLoading] =
    useState<boolean>(false);

  const router = useRouter();

  const postCheckboxRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (project.Attachments) {
      const imgStringArr = project.Attachments.split(",");
      setImageHolder(imgStringArr);
    }
  }, [project]);

  const handleImageDrop = useCallback((acceptedFiles: Blob[]) => {
    acceptedFiles.forEach((file: Blob) => {
      setImages((prevImages) => [...prevImages, file]);
      const reader = new FileReader();
      reader.onload = () => {
        const str = reader.result;
        if (str) setImageHolder((prevHeldImages) => [...prevHeldImages, str]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const savingStateToggle = () => {
    setSavingAsDraft(!savingAsDraft);
  };

  const editPhotographyPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitButtonLoading(true);
    if (titleRef.current) {
      let attachmentString = "";
      images.forEach(async (image, index) => {
        const key = await AddImageToS3(
          image,
          titleRef.current!.value,
          "photography"
        );
        attachmentString += key + ",";
      });
      const data = {
        title: titleRef.current.value,
        blurb: editorContent,
        embedded_link: null,
        attachments: attachmentString,
        published: !savingAsDraft,
        type: "photography",
      };
      await fetch(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/database/project-manipulation`,
        { method: "POST", body: JSON.stringify(data) }
      );
    }

    setSubmitButtonLoading(false);
  };

  const deletePost = async () => {
    setDeleteButtonLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_DOMAIN}/api/database/delete-by-id`, {
      method: "POST",
      body: JSON.stringify({ id: project.id }),
    });
    router.back();
    router.refresh();
    setDeleteButtonLoading(false);
  };

  const removeImage = async (index: number, key: string) => {
    const imgStringArr = project.Attachments!.split(",");
    const newString = imgStringArr.filter((str) => str !== key).join(",");
    const res = await fetch("/api/s3/deleteImage", {
      method: "POST",
      body: JSON.stringify({
        key: key,
        newAttachmentString: newString,
        id: project.id,
      }),
    });
    console.log(res.json());
    setImages((prevImages) =>
      prevImages.filter((image, i) => i !== index - imageHolder.length)
    );
    setImageHolder((prevHeldImages) =>
      prevHeldImages.filter((image, i) => i !== index)
    );
  };

  return (
    <div className="py-8 overflow-scroll">
      <div className="text-2xl text-center">Edit Photography Post</div>
      <div className="flex justify-end">
        <button
          type="submit"
          onClick={deletePost}
          className={`${
            !deleteButtonLoading
              ? "w-40 border-red-500 bg-red-400 hover:bg-red-500"
              : "w-36 border-zinc-500 bg-zinc-400 hover:bg-zinc-500"
          } rounded border mr-12 text-white shadow-md transform active:scale-90 transition-all duration-300 ease-in-out px-4 py-2`}
        >
          {!deleteButtonLoading ? "Delete Post" : "Loading..."}
        </button>
      </div>
      <div className="flex justify-center">
        <form
          onSubmit={editPhotographyPage}
          className="flex flex-col align-middle justify-evenly w-1/2"
        >
          <div className="input-group mx-auto">
            <input
              ref={titleRef}
              type="text"
              className="bg-transparent w-[500px] underlinedInput"
              defaultValue={project.Title}
              name="title"
              required
              placeholder=" "
            />
            <span className="bar"></span>
            <label className="underlinedInputLabel">Title</label>
          </div>
          <div className="py-4">
            <div className="text-center font-light text-lg">
              Enter Blurb below (optional)
            </div>
            <div className="pt-4 prose lg:prose-lg ProseMirror">
              <TextEditor
                updateContent={setEditorContent}
                preSet={project.Blurb ? project.Blurb : " "}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-center text-lg py-4 -mb-2 font-light">
              Images - NEEDS WORK - The order of upload determines order of
              appearance with no ability to adjust
            </div>
            <div className="flex justify-center">
              <Dropzone
                onDrop={handleImageDrop}
                acceptedFiles={"image/jpg, image/jpeg, image/png"}
              />
            </div>
            <div className="grid grid-cols-6 gap-4 -mx-24">
              {imageHolder.map((key, index) => (
                <div key={index}>
                  <button
                    type="button"
                    className="absolute ml-4 pb-[120px] hover:bg-white hover:bg-opacity-80"
                    onClick={() => removeImage(index, key as string)}
                  >
                    <XCircle
                      height={24}
                      width={24}
                      stroke={"black"}
                      strokeWidth={1}
                    />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element,
                    jsx-a11y/alt-text */}
                  <img
                    src={env.NEXT_PUBLIC_AWS_BUCKET_STRING + key}
                    className="w-36 h-36 my-auto mx-4"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-evenly pt-4">
            <div className="flex my-auto">
              <input
                type="checkbox"
                className="my-auto"
                checked={!savingAsDraft}
                ref={postCheckboxRef}
                onClick={savingStateToggle}
                defaultValue={project.Published}
                readOnly
              />
              <div className="my-auto px-2 text-sm font-normal">
                Check to Post
              </div>
            </div>
            <button
              type="submit"
              className={`${
                !savingAsDraft
                  ? "w-32 border-emerald-500 bg-emerald-400 hover:bg-emerald-500"
                  : "w-36 border-blue-500 bg-blue-400 hover:bg-blue-500 "
              } rounded border text-white shadow-md transform active:scale-90 transition-all duration-300 ease-in-out px-4 py-2`}
            >
              {!savingAsDraft ? "Post!" : "Save as Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}