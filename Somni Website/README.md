# Somni Systems Website

A simple static landing page for Somni Systems, an early-stage startup building personalized neck support for better sleep.

## Live Site Setup

This site is designed to stay inside the `Somni Website/` folder in the GitHub repository.

The repository root should contain a small redirect file:

```text
index.html
```

That redirect opens:

```text
Somni Website/index.html
```

## Site Files

Keep these files together inside `Somni Website/`:

```text
index.html
styles.css
qr.html
qr.js
assets/somni-hero.svg
assets/somni-qr.png
```

The main page uses relative paths, so the CSS and assets work from inside the folder.

## GitHub Pages Settings

1. Open `DannarZharkyn/DannarZharkyn.github.io`.
2. Go to **Settings**.
3. Go to **Pages**.
4. Set source to **Deploy from a branch**.
5. Branch: `main`.
6. Folder: `/ (root)`.
7. Click **Save**.

The public URL should be:

```text
https://dannarzharkyn.github.io/
```

It redirects to:

```text
https://dannarzharkyn.github.io/Somni%20Website/
```

## Notes

- The waitlist form is a placeholder and does not submit emails yet.
- The QR code file is `assets/somni-qr.png`.
- Update the email form behavior later when a waitlist backend or form tool is chosen.
