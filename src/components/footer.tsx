const Footer = () => {
  return (
    <footer className="mt-8 flex justify-center text-xs text-muted-foreground">
      <span>
        Made with <span aria-label="love" role="img">❤️</span> by{' '}
        <a
          href="https://github.com/yassenshopov"
          className="font-medium text-foreground hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Yassen Shopov
        </a>
      </span>
    </footer>
  );
};

export default Footer;
