"use client";

import TextEditor from "~/components/TextEditor";
import { useCallback, useRef, useState } from "react";
import Dropzone from "~/components/Dropzone";
import XCircle from "~/icons/XCircle";
import AddImageToS3 from "./s3Upload";
import { useRouter } from "next/navigation";
import CheckCircle from "~/icons/CheckCircle";

export default function CreatePhotographyForm() {
  const [editorContent, setEditorContent] = useState<string>("");
  const [images, setImages] = useState<(File | Blob)[]>([]);
  const [imageHolder, setImageHolder] = useState<(string | ArrayBuffer)[]>([]);
  const [savingAsDraft, setSavingAsDraft] = useState<boolean>(true);
  const [submitButtonLoading, setSubmitButtonLoading] =
    useState<boolean>(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const router = useRouter();

  const postCheckboxRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

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
  const coverImageSetter = (imageName: string) => {
    setCoverImage(imageName);
  };

  const createPhotographyPage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitButtonLoading(true);
    if (titleRef.current) {
      // Use Array.prototype.map() to create an array of promises
      const uploadPromises = images.map((image) =>
        AddImageToS3(
          image,
          titleRef.current!.value.replace(" ", "_"),
          "photography",
        ),
      );

      // Use Promise.all() to wait for all promises to resolve
      const keys = await Promise.all(uploadPromises);

      const data = {
        title: titleRef.current.value.replaceAll(" ", "_"),
        blurb: editorContent,
        images: keys,
        cover_image: coverImage
          ? coverImage.replaceAll("+", "_").replaceAll(" ", "_")
          : null,
        published: !savingAsDraft,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_DOMAIN}/api/database/photography/create`,
        { method: "POST", body: JSON.stringify(data) },
      );
      const id = (await res.json()).id;
      router.push(`/admin/control/flow-control/${id}`);
    }

    setSubmitButtonLoading(false);
  };

  const removeImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setImageHolder((prevHeldImages) =>
      prevHeldImages.filter((_, i) => i !== index),
    );
  };

  return (
    <div className="py-8 overflow-scroll">
      <div className="text-2xl text-center">Create A Photography Post</div>
      <div className="flex justify-center">
        <form
          onSubmit={createPhotographyPage}
          className="flex flex-col align-middle justify-evenly w-1/2"
        >
          <div className="input-group mx-auto">
            <input
              ref={titleRef}
              type="text"
              className="bg-transparent w-[500px] underlinedInput"
              name="title"
              required
              placeholder=" "
            />
            <span className="bar"></span>
            <label className="underlinedInputLabel">Title</label>
          </div>
          <div className="py-4 mx-auto">
            <div className="text-center font-light text-lg">
              Enter Blurb below (optional)
            </div>
            <div className="pt-4 prose lg:prose-lg ProseMirror">
              <TextEditor updateContent={setEditorContent} />
            </div>
          </div>
          <div className="flex justify-center">
            <Dropzone
              onDrop={handleImageDrop}
              acceptedFiles={"image/jpg, image/jpeg, image/png"}
            />
          </div>
          <div className="text-center text-xl mb-4">
            You can click on the center of an image to set it as the cover photo
            (portrait works best)
          </div>
          <div className="grid grid-cols-6 gap-4 -mx-24">
            {images.map((image, index) => (
              <div key={index}>
                {image.name == coverImage ? (
                  <div className="absolute translate-x-16 translate-y-12">
                    <div className="absolute z-0 bg-emerald-400 ml-1.5 mt-1.5 rounded-full w-10 h-10" />
                    <CheckCircle
                      height={52}
                      width={52}
                      strokeWidth={1.5}
                      stroke={"#27272a"}
                      className="z-10 absolute"
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  className="absolute ml-4 pb-[120px] hover:bg-white hover:bg-opacity-80"
                  onClick={() => removeImage(index)}
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
                  src={imageHolder[index] as string}
                  className="w-36 h-36 my-auto mx-4"
                  onClick={() => coverImageSetter(image.name)}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-evenly pt-4">
            <div className="flex my-auto">
              <input
                type="checkbox"
                className="my-auto"
                checked={!savingAsDraft}
                ref={postCheckboxRef}
                onClick={savingStateToggle}
                readOnly
              />
              <div className="my-auto px-2 text-sm font-normal">
                Check to Post
              </div>
            </div>
            <button
              type={submitButtonLoading ? "button" : "submit"}
              disabled={submitButtonLoading}
              className={`${
                submitButtonLoading
                  ? "w-32 bg-zinc-500"
                  : !savingAsDraft
                  ? "w-32 border-emerald-500 bg-emerald-400 hover:bg-emerald-500"
                  : "w-36 border-blue-500 bg-blue-400 hover:bg-blue-500 "
              } rounded border text-white shadow-md transform active:scale-90 transition-all duration-300 ease-in-out px-4 py-2`}
            >
              {submitButtonLoading
                ? "Loading..."
                : !savingAsDraft
                ? "Post!"
                : "Save as Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
