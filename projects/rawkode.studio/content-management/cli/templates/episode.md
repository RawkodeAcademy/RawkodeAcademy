# {{episode.title}}

## Links
{% for link in episode.links %}
* {{link}}
{%- endfor %}

## Timeline
{% for title, chapter in episode.chapter %}
* {{chapter.time}} - {{title}}
{%- endfor %}
