import { useState } from 'react'
import { useRouter } from 'next/router'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    linkWithPopup,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function Login() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password)
            } else {
                await createUserWithEmailAndPassword(auth, email, password)
            }
            router.push('/home')
        } catch (err) {
            setError(err.message)
        }
    }

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider()
        setError('')
        try {
            provider.setCustomParameters({ prompt: 'select_account' })

            if (auth.currentUser) {
                // すでにログインしている → Google認証をリンクする
                const result = await linkWithPopup(auth.currentUser, provider)
                alert('Googleアカウントをリンクしました！')
                console.log('リンク成功:', result.user)
            } else {
                // 通常のGoogleログイン
                const result = await signInWithPopup(auth, provider)
                const user = result.user

                const adminGmails = process.env.NEXT_PUBLIC_ADMIN_GMAILS?.split(',') || []
                if (user && adminGmails.includes(user.email)) {
                    router.push('/home') // 管理者ページ
                } else {
                    router.push('/home') // 一般ユーザー
                }
            }
        } catch (err) {
            if (err.code === 'auth/credential-already-in-use') {
                setError('このGoogleアカウントは他のユーザーに既に使われています。')
            } else if (err.code === 'auth/provider-already-linked') {
                setError('このGoogleアカウントは既にリンクされています。')
            } else {
                setError(err.message)
            }
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
            {/* ▼ ロゴ */}
            <img
                src="/logo.png"
                alt="Web Cinema Logo"
                className="w-80 h-80 mb-6"
            />

            <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded shadow-md space-y-4 w-80">
                <h2 className="text-2xl font-bold mb-4">{isLogin ? 'ログイン' : '新規登録'}</h2>

                <input
                    type="email"
                    placeholder="メールアドレス"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 rounded bg-black border border-gray-600 text-white"
                    required
                />

                <input
                    type="password"
                    placeholder="パスワード"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 rounded bg-black border border-gray-600 text-white"
                    required
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded">
                    {isLogin ? 'ログイン' : '新規登録'}
                </button>

                <p
                    className="text-sm text-center text-blue-400 cursor-pointer"
                    onClick={() => setIsLogin(!isLogin)}
                >
                    {isLogin ? 'アカウントを作成する' : 'ログインはこちら'}
                </p>

                {/* ▼ Googleログイン */}
                <div className="border-t border-gray-600 pt-4">
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full bg-white hover:bg-gray-200 py-2 px-4 rounded mt-2 flex items-center justify-center gap-3"
                    >
                        <img
                            src="/google_icon.png"
                            alt="Google Logo"
                            className="w-5 h-5"
                        />
                        <span className="text-black font-medium">Googleでログイン / 連携</span>
                    </button>
                </div>
            </form>

            {/* ▼ Googleロゴ出典 */}
            <p className="text-xs text-gray-500 mt-4">
                <a target="_blank" rel="noopener noreferrer" href="https://icons8.com/icon/17949/google">
                    Googleのロゴ
                </a>{' '}
                アイコン by{' '}
                <a target="_blank" rel="noopener noreferrer" href="https://icons8.com">
                    Icons8
                </a>
            </p>
        </div>
    )
}
