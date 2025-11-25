export default function NotFound() {
    document.title = "404: Page not found"
    return (
        <div className="text-center" style={{ padding: "40px", marginTop: "12rem" }}>
            <h1>404</h1>
            <p>Page not found</p>
            <a href="/">Go Home</a>
        </div>
    );
}
