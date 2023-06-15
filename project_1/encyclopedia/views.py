import random
from django.shortcuts import render, redirect, HttpResponse
from . import util


def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })

def entry(request, title):
    return render(request, "encyclopedia/entry.html", {
        "entry": util.display_entry(title),
        "title": title
    })

def search(request):
    if request.method == 'POST':
        q = request.POST['q']
        entries = util.list_entries()
        entries = [i.lower() for i in entries]
        if q in entries:
            return redirect('/wiki/'+q)
        res = [i for i in entries if q in i]
        return render(request, "encyclopedia/search.html", {
            "q": q,
            "res": res
        })
            
def newpage(request):
    if request.method == 'POST':
        title = request.POST['title']
        content = request.POST['content']
        if title in util.list_entries():
            return HttpResponse(f"<h1>A page with the title \"{title}\" already exists!</h1>")
        util.save_entry(title, content)
        return redirect('/wiki/'+title)
    elif request.method == 'GET':
        return render(request, "encyclopedia/newpage.html")

def editpage(request):
    if request.method == 'GET':
        title = request.GET['title']
        if title.lower() in [i.lower() for i in util.list_entries()]:
            content = util.get_entry(title)
            return render(request, "encyclopedia/editpage.html", {
                "title": title,
                "content": content
            })
        else:
            return HttpResponse(f"<h1>A page with the title \"{title}\" does not exist &#128194;</h1>")
    elif request.method == 'POST':
        title = request.POST['title']
        content = request.POST['content']
        util.save_entry(title, content)
        return redirect('/wiki/'+title)

def randompage(request):
    return redirect('/wiki/'+random.choice(util.list_entries()))