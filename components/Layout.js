import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { auth } from '../lib/firebase'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import Link from 'next/link'

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [isAdmin, setIsAdmin] = useState(false) // ← 追加
    const sidebarRef = useRef(null)
    const router = useRouter()

    // 管理者チェック
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            const adminGmails = process.env.NEXT_PUBLIC_ADMIN_GMAILS?.split(',') || []
            if (user && adminGmails.includes(user.email)) {
                setIsAdmin(true)
            } else {
                setIsAdmin(false)
            }
        })
        return () => unsubscribe()
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        if (!search.trim()) return
        router.push(`/search?query=${encodeURIComponent(search)}`)
        setSidebarOpen(false)
    }

    const handleLogout = async () => {
        await signOut(auth)
        setSidebarOpen(false)
        router.push('/')
    }

    // 外部クリックでメニューを閉じる
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setSidebarOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [sidebarOpen])

    const closeSidebarAndNavigate = (href) => {
        setSidebarOpen(false)
        router.push(href)
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* ヘッダー */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-700 flex items-center justify-between p-4">
                <button onClick={() => setSidebarOpen(true)} className="text-white text-2xl mr-4">
                    &#9776;
                </button>

                <div className="flex items-center space-x-4">
                    {/* ロゴ画像 */}
                    <Link href="/home">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="h-10 w-auto object-contain"
                        />
                    </Link>
                    <form onSubmit={handleSearch} className="ml-auto">
                        <input
                            type="text"
                            placeholder="タイトル検索 🔍"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-64 p-2 rounded bg-gray-800 text-white border border-gray-600"
                        />
                    </form>
                </div>
            </header>

            {/* サイドメニュー */}
            <aside
                ref={sidebarRef}
                className={`fixed top-0 left-0 h-full w-64 bg-gray-800 transform ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } transition-transform duration-300 ease-in-out z-40 flex flex-col`}
            >
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-white text-2xl absolute top-4 right-4"
                >
                    ✕
                </button>

                <div className="flex-1 p-6 space-y-4 overflow-y-auto mt-12">
                    <h2 className="text-2xl font-bold">メニュー</h2>
                    <button onClick={() => closeSidebarAndNavigate('/home')} className="block hover:text-blue-400 text-left w-full">ホーム</button>

                    {/* 管理者のみ表示 */}
                    {isAdmin && (
                        <button onClick={() => closeSidebarAndNavigate('/admin/reviews')} className="block hover:text-blue-400 text-left w-full">
                            管理者レビュー一覧
                        </button>
                    )}

                    <button onClick={() => closeSidebarAndNavigate('/profile')} className="block hover:text-blue-400 text-left w-full">マイページ</button>
                    <button onClick={() => closeSidebarAndNavigate('/settings')} className="block hover:text-blue-400 text-left w-full">設定</button>

                    <hr className="border-gray-600" />

                    <h2 className="text-2xl font-bold">ジャンル</h2>
                    <ul className="space-y-3 text-base">
                        {[
                            { name: 'アクション', id: 28 },
                            { name: 'コメディ', id: 35 },
                            { name: 'ドラマ', id: 18 },
                            { name: 'ロマンス', id: 10749 },
                            { name: 'ホラー', id: 27 },
                            { name: 'アニメ', id: 16 },
                            { name: 'ドキュメンタリー', id: 99 },
                        ].map(({ name, id }) => (
                            <li key={id}>
                                <button
                                    onClick={() => closeSidebarAndNavigate(`/home/?genre=${id}&name=${name}`)}
                                    className="block hover:text-blue-400 text-left w-full"
                                >
                                    {name}
                                </button>
                            </li>
                        ))}
                    </ul>

                    <hr className="border-gray-600" />
                    {/*<div className="text-sm text-gray-400">※ フィルターや絞り込み機能は今後追加予定</div>*/}
                </div>

                {/* ログアウト */}
                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left text-red-400 hover:text-red-200"
                    >
                        ログアウト
                    </button>
                </div>
            </aside>

            {/* メイン */}
            <main className="pt-[80px] px-4 md:px-6">{children}</main>

            {/* フッター */}
            <footer className="text-center text-xs text-gray-500 mt-8 pb-4">
                <a target="_blank" href="https://icons8.com/icon/17949/google" rel="noopener noreferrer">
                    Googleのロゴ
                </a> アイコン by{' '}
                <a target="_blank" href="https://icons8.com" rel="noopener noreferrer">
                    Icons8
                </a>
            </footer>
        </div>
    )
}
