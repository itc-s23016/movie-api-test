import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { db } from '../lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

export default function Home() {
    const [popularMovies, setPopularMovies] = useState([])
    const [famousMovies, setFamousMovies] = useState([])
    const [genreMovies, setGenreMovies] = useState([])
    const [comments, setComments] = useState([])

    const [currentPage, setCurrentPage] = useState(1) // ← 現在のページ
    const [totalPages, setTotalPages] = useState(1)   // ← 総ページ数（APIから取得）

    const router = useRouter()
    const genreId = router.query.genre
    const genreName = router.query.name

    useEffect(() => {
        if (!genreId) {
            async function fetchPopular() {
                const res = await fetch('https://api.themoviedb.org/3/movie/popular?language=ja-JP&page=1', {
                    headers: {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN}`,
                        accept: 'application/json',
                    },
                })
                const data = await res.json()
                setPopularMovies(data.results)
            }
            fetchPopular()
        }
    }, [genreId])

    useEffect(() => {
        if (genreId) {
            async function fetchGenreMovies() {
                const res = await fetch(
                    `https://api.themoviedb.org/3/discover/movie?with_genres=${genreId}&language=ja-JP&page=${currentPage}`,
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN}`,
                            accept: 'application/json',
                        },
                    }
                )
                const data = await res.json()
                setGenreMovies(data.results)
                setTotalPages(data.total_pages) // ← 総ページ数を保存
            }
            fetchGenreMovies()
        }
    }, [genreId, currentPage]) // ← currentPage 依存を追加

    useEffect(() => {
        // ジャンルが変わったときにページ番号を1にリセット
        setCurrentPage(1)
    }, [genreId])


    useEffect(() => {
        async function fetchFamous() {
            const ids = [1891, 11, 238, 155, 278, 122]
            const movies = await Promise.all(
                ids.map((id) =>
                    fetch(`https://api.themoviedb.org/3/movie/${id}?language=ja-JP`, {
                        headers: {
                            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN}`,
                            accept: 'application/json',
                        },
                    }).then((res) => res.json())
                )
            )
            setFamousMovies(movies)
        }
        fetchFamous()
    }, [])

    useEffect(() => {
        const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviews = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    ...data,
                    top: Math.random() * window.innerHeight,
                    delay: Math.random() * 5,
                }
            })
            setComments(reviews)
        })
        return () => unsubscribe()
    }, [])

    return (
        <div className="relative p-6 bg-black min-h-screen text-white overflow-hidden">
            {genreId && (
                <>
                    <h1 className="text-3xl font-bold mb-6">{genreName} の映画</h1>

                    {/* ▼ ページネーション UI */}
                    <div className="flex justify-center gap-4 mb-10">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                            disabled={currentPage === 1}
                        >
                            前へ
                        </button>
                        <span className="flex items-center">{currentPage} / {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                            disabled={currentPage === totalPages}
                        >
                            次へ
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-6">
                        {genreMovies.map((movie) => (
                            <Link href={`/movie/${movie.id}`} key={movie.id}>
                                <div className="bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700">
                                    <img src="/noimage.png" alt="No image" className="rounded shadow-lg w-full" />
                                    <p className="mt-2 text-sm font-medium truncate" title={movie.title}>
                                        {movie.title}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>

                </>
            )}

            {!genreId && (
                <>
                    <h1 className="text-3xl font-bold mb-6">人気の映画</h1>
                    <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-10">
                        {popularMovies.map((movie) => (
                            <Link href={`/movie/${movie.id}`} key={movie.id}>
                                <div className="bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700">
                                    <img src="/noimage.png" alt="No image" className="rounded shadow-lg w-full" />
                                    <p className="mt-2 text-sm font-medium truncate" title={movie.title}>
                                        {movie.title}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}

            {!genreId && (
                <>
                    <h2 className="text-2xl font-semibold mb-4">みんなが知ってる有名映画</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
                        {famousMovies.map((movie) => (
                            <Link href={`/movie/${movie.id}`} key={movie.id}>
                                <div className="bg-gray-700 p-2 rounded cursor-pointer hover:bg-gray-600">
                                    <img src="/noimage.png" alt="No image" className="rounded shadow-lg w-full" />
                                    <p className="mt-2">{movie.title}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </>
            )}
            {/*{弾幕コメントはジャンル未選択のみ表示}*/}
            {!genreId && comments.map((comment, index) => (
                <Link href={`/movie/${comment.movieId}`} key={`${comment.id}-${index}`}>
                    <div
                        className="absolute whitespace-nowrap text-lg font-bold text-white cursor-pointer"
                        style={{
                            top: `${comment.top}px`,
                            transform: 'translateX(100vw)',
                            animationDelay: `${comment.delay}s`,
                            animationName: 'slide',
                            animationDuration: '15s',
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                            willChange: 'transform',
                        }}
                    >
                        {'⭐'.repeat(comment.rating)} {comment.text}
                    </div>
                </Link>
            ))}

            <style jsx>{`
                @keyframes slide {
                    0% {
                        transform: translateX(100vw);
                    }
                    100% {
                        transform: translateX(-100%);
                    }
                }
            `}</style>
        </div>
    )
}