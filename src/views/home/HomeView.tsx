"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

import { homeQueryOptions } from "@/features/home/api/queries";
import { ProductCard } from "@/features/products/ui/ProductCard";
import { ProductGridSkeleton } from "@/features/products/ui/ProductSkeleton";
import { Skeleton } from "@/shared/ui/loading/Skeleton";
import type { Product } from "@/types/commerce";

import "@/shared/ui/week-05-layout.css";

export function HomeView() {
  const { data, isLoading, isError, error } = useQuery(homeQueryOptions());

  return (
    <main className="week05-page">
      <header className="week05-header">
        <Link href="/">Commerce</Link>
        <nav aria-label="주요 메뉴">
          <Link href="/products">상품</Link>
          <span>위시리스트 0</span>
          <span>장바구니 0</span>
        </nav>
      </header>

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

interface ProductSectionProps {
  title: string;
  products: Product[];
}

function ProductSection({ title, products }: ProductSectionProps) {
  return (
    <section className="week05-section">
      <h2>{title}</h2>
      {products.length === 0 ? (
        <p>표시할 상품이 없습니다.</p>
      ) : (
        <div className="week05-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

// API가 홈 상품을 섹션당 6개 준다. 로딩과 성공의 그리드 높이를 맞추려고 같은 개수를 그린다.
const HOME_SECTION_PRODUCT_COUNT = 6;

// 실제 마크업과 같은 클래스를 써서 로딩과 성공 사이에 레이아웃이 흔들리지 않게 한다.
function HomeSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="min-h-[220px] max-[720px]:min-h-[180px]" />
      <section className="week05-section">
        <Skeleton className="mb-4 h-6 w-24" />
        <div className="week05-categories">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-20" />
          ))}
        </div>
      </section>
      {["popular", "new"].map((section) => (
        <section className="week05-section" key={section}>
          <Skeleton className="mb-4 h-6 w-24" />
          <ProductGridSkeleton count={HOME_SECTION_PRODUCT_COUNT} />
        </section>
      ))}
    </div>
  );
}
