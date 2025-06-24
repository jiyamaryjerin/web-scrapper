import requests
from bs4 import BeautifulSoup

def process_input(url):
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    main_content = None

    if soup.article:
        main_content = soup.article.get_text(separator='\n', strip=True)
    else:
        divs = soup.find_all('div', class_=lambda x: x and ('content' in x or 'post' in x))
        if divs:
            main_content = '\n'.join(div.get_text(separator='\n', strip=True) for div in divs)
        elif soup.main:
            main_content = soup.main.get_text(separator='\n', strip=True)
        else:
            ps = soup.find_all('p')
            if ps:
                main_content = '\n\n'.join(p.get_text(strip=True) for p in ps if p.get_text(strip=True))
            else:
                main_content = soup.get_text(separator='\n', strip=True)

    return main_content