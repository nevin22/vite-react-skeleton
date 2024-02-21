export default function Root() {
    return (
        <>
            <div id="sidebar">
                <h1>REACT SKELETON</h1>
                <nav>
                    <ul>
                        <li>
                            <a href={`/contacts/1`}>Nev</a>
                        </li>
                        <li>
                            <a href={`/contacts/2`}>Ai friend</a>
                        </li>
                        <li>
                            <a href={`/signup`}>Sign up bro</a>
                        </li>
                    </ul>
                </nav>
            </div>
            <div id="detail"></div>
        </>
    );
}