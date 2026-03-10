# Ensure documents explicitly marked as noindex are omitted from sitemap.xml.
Jekyll::Hooks.register %i[pages posts documents], :pre_render do |doc|
  next unless doc.data['noindex']

  doc.data['sitemap'] = false
end
