# Generates one page per tag at /tags/<tag-slug>/
module Jekyll
  class TagPage < Page
    def initialize(site, base, tag_name, tag_slug)
      @site = site
      @base = base
      @dir = File.join('tags', tag_slug)
      @name = 'index.html'

      process(@name)
      read_yaml(File.join(base, '_layouts'), 'tag.html')

      data['tag'] = tag_name
      data['tag_slug'] = tag_slug
      data['title'] = "##{tag_name}"
      data['description'] = "Beiträge mit dem Tag #{tag_name}."
    end
  end

  class TagPageGenerator < Generator
    safe true

    def generate(site)
      site.tags.each_key do |tag_name|
        tag_slug = Utils.slugify(tag_name.to_s, mode: 'pretty', cased: false)
        site.pages << TagPage.new(site, site.source, tag_name, tag_slug)
      end
    end
  end
end
