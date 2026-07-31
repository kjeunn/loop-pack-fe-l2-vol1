"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

import { homeQueryOptions } from "@/features/home/api/queries";
import { ProductSection } from "@/features/products/ui/ProductSection";
import { Header } from "@/widgets/header/ui/Header";

import { HomeSkeleton } from "./HomeSkeleton";

import "@/shared/ui/week-05-layout.css";

export function HomeView() {
  const { data, isLoading, isError, error } = useQuery(homeQueryOptions());

  return (
    <main className="week05-page">
      <Header />

      {isLoading && <HomeSkeleton />}

      {isError && (
        <section className="week05-section">
          <p role="alert">{error?.message}</p>
        </section>
      )}

      {data && (
        <>
          <section className="week05-hero">
            {/* 제목·설명이 이미 텍스트로 있는 장식 이미지다.
                alt를 비워 스크린리더가 같은 내용을 두 번 읽지 않게 한다. */}
            <Image
              className="week05-hero-image"
              src={data.banner.image}
              alt=""
              fill
              sizes="100vw"
              priority
            />
            <p>{data.banner.description}</p>
            <h1>{data.banner.title}</h1>
          </section>
          <section className="week05-section">
            <h2>카테고리</h2>
            <div className="week05-categories">
              {data.categories.map((category) => (
                <Link key={category.id} href={`/products?category=${category.id}`}>
                  {category.name}
                </Link>
              ))}
            </div>
          </section>
          <ProductSection title="인기 상품" products={data.popularProducts} />
          <ProductSection title="신상품" products={data.newProducts} />
        </>
      )}
    </main>
  );
}
