require 'digest'
require 'base64'

# Computes the SHA-256 CSP hash of _includes/theme-init-inline.js at build time
# and exposes it as site.theme_csp_hash (e.g. 'sha256-abc123==').
# Used in _headers (which Jekyll processes as a Liquid template) so the CSP
# script-src hash always stays in sync with the inline script in header.html.

Jekyll::Hooks.register :site, :after_init do |site|
  path = File.join(site.source, '_includes', 'theme-init-inline.js')
  if File.exist?(path)
    content = File.read(path, encoding: 'utf-8')
    hash = Base64.strict_encode64(Digest::SHA256.digest(content))
    site.config['theme_csp_hash'] = "'sha256-#{hash}'"
  else
    Jekyll.logger.warn 'csp_hash:', '_includes/theme-init-inline.js not found — CSP hash will be empty'
    site.config['theme_csp_hash'] = ''
  end
end
