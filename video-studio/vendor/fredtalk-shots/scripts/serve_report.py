#!/usr/bin/env python3
"""Serve a local Fredtalk Shots report with byte-range video seeking."""
import argparse
import functools
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class ReportHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        self.byte_range = None
        path = Path(self.translate_path(self.path))
        header = self.headers.get('Range')
        if not header or not path.is_file():
            return super().send_head()
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', header)
        total = path.stat().st_size
        if not match or not any(match.groups()) or not total:
            self.send_error(416, 'Unsupported byte range')
            return None
        left, right = match.groups()
        if left:
            start, end = int(left), min(int(right) if right else total - 1, total - 1)
        else:
            start, end = max(0, total - int(right)), total - 1
        if start >= total or end < start:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{total}')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        stream = path.open('rb')
        stream.seek(start)
        self.byte_range = end - start + 1
        self.send_response(206)
        self.send_header('Content-type', self.guess_type(str(path)))
        self.send_header('Content-Range', f'bytes {start}-{end}/{total}')
        self.send_header('Content-Length', str(self.byte_range))
        self.send_header('Accept-Ranges', 'bytes')
        self.end_headers()
        return stream

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def copyfile(self, source, outputfile):
        try:
            if self.byte_range is None:
                return super().copyfile(source, outputfile)
            remaining = self.byte_range
            while remaining:
                block = source.read(min(1024 * 1024, remaining))
                if not block:
                    break
                outputfile.write(block)
                remaining -= len(block)
        except (BrokenPipeError, ConnectionResetError):
            pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--directory', required=True, type=Path)
    parser.add_argument('--port', type=int, default=8119)
    args = parser.parse_args()
    directory = args.directory.resolve(strict=True)
    handler = functools.partial(ReportHandler, directory=str(directory))
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    print(f'Fredtalk Shots: http://127.0.0.1:{args.port}/shots-report.html', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()


if __name__ == '__main__':
    main()
