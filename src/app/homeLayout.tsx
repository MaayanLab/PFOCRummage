import Image from "next/image";
import React from "react";
import Stats from "./stats";
import Link from "next/link";

export default function HomeLayout({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex justify-center">
      <div className="flex flex-col lg:flex-row items-center justify-center">
        <div className="card max-w-xs shadow-2xl bg-base-100 flex-shrink-0">
          <div className="card-body">{children}</div>
        </div>
        <div className="text-center p-10">
          <h2 className="text-2xl font-bold p-2">PFOCRummage</h2>
          <div className="inline-flex">
            <Image
              className={"rounded"}
              src={"/images/PFOCRummageBlack.png"}
              width={225}
              height={225}
              alt={"PFOCRummage"}
            ></Image>
          </div>
          <React.Suspense
            fallback={
              <div className="text-center p-5">
                <Image
                  className={"rounded mx-auto"}
                  src={"/images/PFOCRummage.gif"}
                  width={125}
                  height={250}
                  alt={"Loading..."}
                />{" "}
              </div>
            }
          >
            <h1 className="text-2xl font-bold">
              <span className="whitespace-nowrap">
                {" "}
                Rummage through <Stats bold show_gene_sets />
              </span>
            </h1>
            <div>
              <span className="whitespace-nowrap">
                extracted from figures of pathways found in{" "}
              </span>
              <Stats bold show_pmcs />.
            </div>
            <div className="mt-5">
              <div className="whitespace-nowrap">
                {" "}
                PFOCRummage is a gene set search engine for finding gene sets{" "}
              </div>
              <div>
                <span className="whitespace-nowrap">
                  {" "}
                  extracted by the{" "}
                  <a
                    href="https://pfocr.wikipathways.org/"
                    target="_blank"
                    style={{ textDecoration: "underline" }}
                  >
                    Pathway Figure Optical Character Recognition (PFOCR)
                  </a>
                </span>{" "}
              </div>
              <div>resource from PubMed Central (PMC) articles.</div>
              <br />
              <div>
                Query PMC and receive gene sets extracted from images
                <div>of pathways in research publications.</div>
              </div>
            </div>
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}
