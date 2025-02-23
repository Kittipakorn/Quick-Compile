#include <bits/stdc++.h>
using namespace std;
int x,mx=0,mn=1000;

int main() {
    for(int i=0;i<5;i++){
        cin>>x;
        mn = min(mn,x);
        mx = max(mx,x);
    }
    cout<<mn<<" "<<mx;
}