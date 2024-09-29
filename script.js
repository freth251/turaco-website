
document.addEventListener('DOMContentLoaded', function() {
    const scrollButtons = document.querySelectorAll('.scroll-button');
    
    scrollButtons.forEach(button => {
        button.addEventListener('click', function() {
            
            const targetId = this.getAttribute('data-target');
            if (!window.location.href.includes("index.html")){
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });

            }else{
            const targetElement = document.getElementById(targetId);
            
            console.log("TID: ", targetElement);
            console.log("TE: ", targetElement)
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }

        
            }
        });
    });


    const bookButtons = document.querySelectorAll('.book-button');

    bookButtons.forEach(button => {
        button.addEventListener('click', function(){
            window.location.href = "book.html"
        });
    });
    var swiper = new Swiper('.swiper-container', {
        loop: true,
        pagination: {
           el: '.swiper-pagination',
           clickable: true,
        },
        navigation: {
           nextEl: '.swiper-button-next',
           prevEl: '.swiper-button-prev',
        },
     });


});