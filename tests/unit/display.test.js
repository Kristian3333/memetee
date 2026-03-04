import { showMeme, showTshirt, showResults, hideResults, resetResults } from '../../src/display.js';

describe('showMeme', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('creates an img element with the correct src', () => {
    showMeme('https://example.com/meme.png', container);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.src).toBe('https://example.com/meme.png');
  });

  it('creates an img element with class result-image', () => {
    showMeme('https://example.com/meme.png', container);
    const img = container.querySelector('img');
    expect(img.classList.contains('result-image')).toBe(true);
  });

  it('clears container content first (placeholder removal)', () => {
    const placeholder = document.createElement('div');
    placeholder.className = 'result-placeholder';
    placeholder.textContent = 'Placeholder';
    container.appendChild(placeholder);

    showMeme('https://example.com/meme.png', container);

    expect(container.querySelector('.result-placeholder')).toBeNull();
    expect(container.querySelectorAll('img').length).toBe(1);
  });
});

describe('showTshirt', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('creates a t-shirt DOM structure', () => {
    showTshirt('https://example.com/meme.png', container);
    const wrapper = container.querySelector('.tshirt-shape');
    expect(wrapper).not.toBeNull();
  });

  it('includes a t-shirt body div with class tshirt-body', () => {
    showTshirt('https://example.com/meme.png', container);
    const body = container.querySelector('.tshirt-body');
    expect(body).not.toBeNull();
  });

  it('overlays the meme image on the t-shirt', () => {
    showTshirt('https://example.com/meme.png', container);
    const overlay = container.querySelector('.tshirt-meme-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay.src).toBe('https://example.com/meme.png');
  });

  it('clears container content first', () => {
    const placeholder = document.createElement('div');
    placeholder.className = 'result-placeholder';
    container.appendChild(placeholder);

    showTshirt('https://example.com/meme.png', container);

    expect(container.querySelector('.result-placeholder')).toBeNull();
    expect(container.querySelector('.tshirt-shape')).not.toBeNull();
  });

  it('includes a neckline div with class tshirt-neckline', () => {
    showTshirt('https://example.com/meme.png', container);
    const neckline = container.querySelector('.tshirt-neckline');
    expect(neckline).not.toBeNull();
  });

  it('includes sleeve divs with class tshirt-sleeve', () => {
    showTshirt('https://example.com/meme.png', container);
    const sleeves = container.querySelectorAll('.tshirt-sleeve');
    expect(sleeves.length).toBe(2);
  });
});

describe('showResults', () => {
  it('sets display to block on the section element', () => {
    const section = document.createElement('section');
    section.style.display = 'none';
    showResults(section);
    expect(section.style.display).toBe('block');
  });
});

describe('hideResults', () => {
  it('sets display to none on the section element', () => {
    const section = document.createElement('section');
    section.style.display = 'block';
    hideResults(section);
    expect(section.style.display).toBe('none');
  });
});

describe('resetResults', () => {
  let memeContainer;
  let tshirtContainer;

  beforeEach(() => {
    memeContainer = document.createElement('div');
    tshirtContainer = document.createElement('div');
  });

  it('clears both containers', () => {
    const existingImg = document.createElement('img');
    existingImg.src = 'meme.png';
    memeContainer.appendChild(existingImg);

    const existingShape = document.createElement('div');
    existingShape.className = 'tshirt-shape';
    tshirtContainer.appendChild(existingShape);

    resetResults(memeContainer, tshirtContainer);

    expect(memeContainer.querySelector('img')).toBeNull();
    expect(tshirtContainer.querySelector('.tshirt-shape')).toBeNull();
  });

  it('restores a placeholder in the meme container', () => {
    resetResults(memeContainer, tshirtContainer);
    expect(memeContainer.querySelector('.result-placeholder')).not.toBeNull();
  });

  it('restores a placeholder in the tshirt container', () => {
    resetResults(memeContainer, tshirtContainer);
    expect(tshirtContainer.querySelector('.result-placeholder')).not.toBeNull();
  });
});
